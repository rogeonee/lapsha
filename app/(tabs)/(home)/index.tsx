import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { getPeople } from '~/api/people/people-service';
import { getTimeline } from '~/api/timeline/timeline-service';
import { Avatar } from '~/components/person/avatar';
import { Button } from '~/components/ui/button';
import { ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { avatarUri } from '~/lib/avatars';
import { palette, shadows } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';
import { cn } from '~/lib/utils';
import type { TimelineEntry } from '~/types/db';

const DAY_MS = 24 * 60 * 60 * 1000;
const COUNTDOWN_WINDOW_DAYS = 30;

interface UpcomingEntry {
  entry: TimelineEntry;
  next: Date;
  daysUntil: number;
  years: number | null;
}

interface RowGroup {
  key: string;
  personId: string;
  personName: string;
  personAvatar: string | null;
  next: Date;
  daysUntil: number;
  entries: UpcomingEntry[];
}

interface TimelineSection {
  key: string;
  title: string;
  subtitle?: string;
  showDay: boolean;
  items: RowGroup[];
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function projectUpcoming(entries: TimelineEntry[]): UpcomingEntry[] {
  const today = startOfToday();

  return entries
    .map((entry) => {
      let next = new Date(today.getFullYear(), entry.month - 1, entry.day);
      if (next < today) {
        next = new Date(today.getFullYear() + 1, entry.month - 1, entry.day);
      }
      const daysUntil = Math.round((next.getTime() - today.getTime()) / DAY_MS);
      const originalYear = Number(entry.date.slice(0, 4));
      const elapsed = next.getFullYear() - originalYear;
      const years = entry.year_known && elapsed > 0 ? elapsed : null;

      return { entry, next, daysUntil, years };
    })
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil ||
        a.entry.person.name.localeCompare(b.entry.person.name) ||
        a.entry.person_id.localeCompare(b.entry.person_id),
    );
}

function buildSections(upcoming: UpcomingEntry[]): TimelineSection[] {
  const currentYear = new Date().getFullYear();
  const sections: TimelineSection[] = [];

  for (const item of upcoming) {
    let key: string;
    let title: string;
    let subtitle: string | undefined;
    let showDay = true;

    if (item.daysUntil <= 1) {
      key = item.daysUntil === 0 ? 'today' : 'tomorrow';
      title = item.daysUntil === 0 ? 'Today' : 'Tomorrow';
      subtitle = item.next.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
      });
      showDay = false;
    } else {
      key = `${item.next.getFullYear()}-${item.next.getMonth()}`;
      title = item.next.toLocaleDateString(undefined, {
        month: 'long',
        ...(item.next.getFullYear() !== currentYear ? { year: 'numeric' } : {}),
      });
    }

    let section = sections[sections.length - 1];
    if (!section || section.key !== key) {
      section = { key, title, subtitle, showDay, items: [] };
      sections.push(section);
    }

    const lastRow = section.items[section.items.length - 1];
    if (
      lastRow &&
      lastRow.personId === item.entry.person_id &&
      lastRow.next.getTime() === item.next.getTime()
    ) {
      lastRow.entries.push(item);
    } else {
      section.items.push({
        key: item.entry.id,
        personId: item.entry.person_id,
        personName: item.entry.person.name,
        personAvatar: item.entry.person.avatar,
        next: item.next,
        daysUntil: item.daysUntil,
        entries: [item],
      });
    }
  }

  return sections;
}

function formatLabel(entry: TimelineEntry): string {
  return entry.label.charAt(0).toUpperCase() + entry.label.slice(1);
}

function formatSuffix({ entry, years }: UpcomingEntry): string | null {
  if (years === null) return null;
  return entry.label.toLowerCase() === 'birthday'
    ? `turns ${years}`
    : `${years} ${years === 1 ? 'year' : 'years'}`;
}

function formatDetail(item: UpcomingEntry): string {
  const suffix = formatSuffix(item);
  const label = formatLabel(item.entry);
  return suffix ? `${label} · ${suffix}` : label;
}

function Countdown({ daysUntil }: { daysUntil: number }) {
  if (daysUntil < 2 || daysUntil > COUNTDOWN_WINDOW_DAYS) return null;
  return (
    <Text className="text-sm text-muted-foreground">
      {`In ${daysUntil} days`}
    </Text>
  );
}

function UpcomingRow({
  group,
  showDay,
  divider,
  onPress,
}: {
  group: RowGroup;
  showDay: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const stacked = group.entries.length > 1;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${group.personName}, ${group.entries
        .map(formatDetail)
        .join(', ')}`}
      className={cn(
        'flex-row gap-3 px-4 py-3 active:bg-black/5',
        stacked ? 'items-start' : 'items-center',
        divider && 'border-t border-black/5',
      )}
    >
      <View className={cn(stacked && 'h-12 justify-center')}>
        {showDay ? (
          <View className="w-11 items-center">
            <Text className="text-lg font-semibold">
              {group.next.getDate()}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {group.next.toLocaleDateString(undefined, { weekday: 'short' })}
            </Text>
          </View>
        ) : (
          <Avatar
            name={group.personName}
            photo={avatarUri(group.personAvatar)}
            size={40}
          />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-medium" numberOfLines={1}>
          {group.personName}
        </Text>
        {group.entries.map((item, index) => {
          const suffix = formatSuffix(item);
          const detail = (
            <Text className="text-base leading-5" numberOfLines={1}>
              {formatLabel(item.entry)}
              {suffix ? (
                <Text className="text-base leading-5 text-muted-foreground">
                  {` · ${suffix}`}
                </Text>
              ) : null}
            </Text>
          );

          if (!stacked) {
            return (
              <View key={item.entry.id} className="mt-0.5">
                {detail}
              </View>
            );
          }

          return (
            <View
              key={item.entry.id}
              className={cn(
                'flex-row items-center gap-2',
                index === 0 ? 'mt-0.5' : 'mt-1',
              )}
            >
              <View className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              <View className="flex-1">{detail}</View>
            </View>
          );
        })}
      </View>
      <View className={cn('flex-row items-center gap-3', stacked && 'h-12')}>
        <Countdown daysUntil={group.daysUntil} />
        <ChevronRightIcon color={palette.warmGrayDeep} />
      </View>
    </Pressable>
  );
}

function TimelineSectionCard({
  section,
  onPersonPress,
}: {
  section: TimelineSection;
  onPersonPress: (personId: string) => void;
}) {
  return (
    <View>
      <Text
        className={cn(
          'mb-2 px-1 text-base font-medium',
          section.key === 'today' && 'text-broth',
        )}
      >
        {section.title}
        {section.subtitle ? (
          <Text className="text-base font-normal text-muted-foreground">
            {` · ${section.subtitle}`}
          </Text>
        ) : null}
      </Text>
      <View
        className="overflow-hidden rounded-2xl bg-white"
        style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
      >
        {section.items.map((group, index) => (
          <UpcomingRow
            key={group.key}
            group={group}
            showDay={section.showDay}
            divider={index > 0}
            onPress={() => onPersonPress(group.personId)}
          />
        ))}
      </View>
    </View>
  );
}

function TimelineSectionListItem({ section }: { section: TimelineSection }) {
  const router = useRouter();

  return (
    <TimelineSectionCard
      section={section}
      onPersonPress={(personId) =>
        router.push({
          pathname: '/(tabs)/(home)/person/[id]',
          params: { id: personId },
        })
      }
    />
  );
}

function renderTimelineSection({ item }: ListRenderItemInfo<TimelineSection>) {
  return <TimelineSectionListItem section={item} />;
}

function loadTimeline(_datesVersion: number, _retryNonce: number) {
  return getTimeline();
}

function loadPeople(_datesVersion: number, _retryNonce: number) {
  return getPeople();
}

export default function HomeScreen() {
  const router = useRouter();
  const datesVersion = useTableVersion(['dates', 'persons']);
  const [retryNonce, setRetryNonce] = useState(0);

  const timelineResponse = loadTimeline(datesVersion, retryNonce);
  const peopleResponse = loadPeople(datesVersion, retryNonce);

  const error = timelineResponse.error
    ? timelineResponse.error.message || 'Failed to load upcoming dates'
    : null;
  const hasPeople = (peopleResponse.data?.length ?? 0) > 0;
  const sections = buildSections(projectUpcoming(timelineResponse.data ?? []));

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-4 text-center text-lg text-destructive">
          Error loading upcoming dates
        </Text>
        <Text
          selectable
          className="mb-6 text-center text-sm text-muted-foreground"
        >
          {error}
        </Text>
        <Button onPress={() => setRetryNonce((n) => n + 1)} variant="outline">
          <Text className="font-medium">Try Again</Text>
        </Button>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-6 text-center text-lg text-muted-foreground">
          {hasPeople ? 'No dates yet.' : 'No people added yet.'}
        </Text>
        <Text className="mb-8 text-center text-sm text-muted-foreground">
          {hasPeople
            ? 'Add a birthday or an anniversary to someone, and it will show up here — whoever’s day comes next, first.'
            : 'Add people and their important dates, and this screen will keep track of whose day is coming up.'}
        </Text>
        <Button
          onPress={() => router.push(hasPeople ? '/people' : '/add-person')}
          variant="outline"
        >
          <Text className="font-medium">
            {hasPeople ? 'Open People' : 'Add Your First Person'}
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.key}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="p-4 gap-5"
      renderItem={renderTimelineSection}
    />
  );
}
