import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SectionList,
  Pressable,
  View,
  type SectionListRenderItemInfo,
} from 'react-native';
import { hasPeople } from '~/api/people/people-service';
import { getUpcomingDates } from '~/api/timeline/timeline-service';
import EntrySheet, {
  type EntrySheetConfig,
} from '~/components/entry/entry-sheet';
import { UnsortedGiftsRow } from '~/components/gifts/unsorted-gifts-row';
import { Avatar } from '~/components/person/avatar';
import { Button } from '~/components/ui/button';
import { EmptyState } from '~/components/ui/empty-state';
import { ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { useCollapsingHeader } from '~/components/ui/use-collapsing-header';
import { avatarUri } from '~/lib/avatars';
import { formatCalendarDay } from '~/lib/dates';
import {
  buildUpcomingSections,
  type UpcomingEntry,
  type UpcomingRowGroup,
  type UpcomingSection,
} from '~/lib/upcoming';
import { useObserveScreen } from '~/lib/use-observe-screen';
import { palette, shadows } from '~/lib/theme';
import { useTableVersion } from '~/lib/use-table-version';
import { useCurrentDay } from '~/lib/use-current-day';
import { cn } from '~/lib/utils';
import type { TimelineEntry } from '~/types/db';

const COUNTDOWN_WINDOW_DAYS = 30;

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
  group: UpcomingRowGroup;
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
            <Text className="text-lg font-semibold">{group.next.day}</Text>
            <Text className="text-sm text-muted-foreground">
              {formatCalendarDay(group.next, { weekday: 'short' })}
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

function renderSectionHeader({ section }: { section: UpcomingSection }) {
  return (
    <Text
      accessibilityRole="header"
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
  );
}

function SectionFooter() {
  return <View className="h-5" />;
}

function TimelineListItem({
  group,
  showDay,
  first,
  last,
}: {
  group: UpcomingRowGroup;
  showDay: boolean;
  first: boolean;
  last: boolean;
}) {
  const router = useRouter();
  return (
    <View
      className={cn(
        'overflow-hidden bg-white',
        first && 'rounded-t-2xl',
        last && 'rounded-b-2xl',
      )}
      style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
    >
      <UpcomingRow
        group={group}
        showDay={showDay}
        divider={!first}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/(home)/person/[id]',
            params: { id: group.personId },
          })
        }
      />
    </View>
  );
}

function renderUpcomingRow({
  item,
  index,
  section,
}: SectionListRenderItemInfo<UpcomingRowGroup, UpcomingSection>) {
  return (
    <TimelineListItem
      group={item}
      showDay={section.showDay}
      first={index === 0}
      last={index === section.data.length - 1}
    />
  );
}

function loadTimeline(_datesVersion: number, _retryNonce: number) {
  return getUpcomingDates();
}

function loadHasPeople(_personsVersion: number, _retryNonce: number) {
  return hasPeople();
}

export default function HomeScreen() {
  useObserveScreen();
  const router = useRouter();
  const header = useCollapsingHeader({ title: 'Upcoming' });
  const datesVersion = useTableVersion(['dates', 'persons']);
  const personsVersion = useTableVersion(['persons']);
  const today = useCurrentDay();
  const [retryNonce, setRetryNonce] = useState(0);
  const [sheetConfig, setSheetConfig] = useState<EntrySheetConfig | null>(null);

  const timelineResponse = loadTimeline(datesVersion, retryNonce);
  const peopleResponse = loadHasPeople(personsVersion, retryNonce);

  const error = timelineResponse.error
    ? timelineResponse.error.message || 'Failed to load upcoming dates'
    : null;
  const peopleExist = !peopleResponse.error && peopleResponse.data === true;
  const sections = buildUpcomingSections(
    timelineResponse.error ? [] : (timelineResponse.data ?? []),
    today,
  );

  if (error) {
    return (
      <View className="flex-1">
        {header.largeTitle ? (
          <View className="px-4">{header.largeTitle}</View>
        ) : null}
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
        {header.bar}
      </View>
    );
  }

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(group) => group.key}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={() => <SectionFooter />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName={
          sections.length === 0
            ? process.env.EXPO_OS === 'ios'
              ? 'px-4'
              : 'grow p-4'
            : 'p-4'
        }
        alwaysBounceVertical={sections.length > 0}
        ListEmptyComponent={
          <EmptyState
            kind={peopleExist ? 'dates' : 'welcome'}
            onPress={() => {
              if (peopleExist) {
                setSheetConfig({ mode: 'create', kind: 'date' });
              } else {
                router.push('/add-person');
              }
            }}
          />
        }
        renderItem={renderUpcomingRow}
        ListHeaderComponent={
          <View>
            {header.largeTitle}
            <UnsortedGiftsRow />
          </View>
        }
        onScroll={header.onScroll}
        scrollEventThrottle={16}
      />
      {header.bar}
      <EntrySheet config={sheetConfig} onClose={() => setSheetConfig(null)} />
    </>
  );
}
