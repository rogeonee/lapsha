import { GiftSection } from '~/components/gifts/gift-section';
import { View } from 'react-native';
import { BIRTHDAY_LABEL } from '~/api/dates/dates-service';
import type { EntrySheetConfig } from '~/components/entry/use-entry-form';
import { AddRow, DateRow, EntryRow } from '~/components/person/entry-row';
import FactSortMenu from '~/components/person/fact-sort-menu';
import { PersonSectionHeader } from '~/components/person/person-section-header';
import { Text } from '~/components/ui/text';
import { Abby } from '~/components/ui/abby';
import { shadows } from '~/lib/theme';
import type { Date as PersonDate, EntrySort, Fact } from '~/types/db';
import type { CalendarDay } from '~/lib/current-day';

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: shadows.whisper,
} as const;

function SectionCard({
  title,
  accessory,
  children,
}: {
  title: string;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-1">
      <PersonSectionHeader title={title} accessory={accessory} />
      <View className="overflow-hidden rounded-2xl bg-white" style={cardStyle}>
        {children}
      </View>
    </View>
  );
}

export function PersonDetailSections({
  personId,
  dates,
  today,
  facts,
  factSort,
  isSortMenuOpen,
  onSortMenuOpenChange,
  onFactSortChange,
  onOpenSheet,
  onDeleteDate,
  onDeleteFact,
}: {
  personId: string;
  dates: PersonDate[];
  today: CalendarDay;
  facts: Fact[];
  factSort: EntrySort;
  isSortMenuOpen: boolean;
  onSortMenuOpenChange: (open: boolean) => void;
  onFactSortChange: (sort: EntrySort) => void;
  onOpenSheet: (config: EntrySheetConfig) => void;
  onDeleteDate: (dateId: string) => void;
  onDeleteFact: (factId: string) => void;
}) {
  const birthday =
    dates.find((date) => date.label.toLowerCase() === BIRTHDAY_LABEL) ?? null;
  const otherDates = dates.filter((date) => date.id !== birthday?.id);

  return (
    <View className="gap-5 px-4">
      <SectionCard title="Dates">
        {birthday ? (
          <DateRow
            date={birthday}
            today={today}
            onPress={() =>
              onOpenSheet({ mode: 'edit', kind: 'date', date: birthday })
            }
            onDelete={() => onDeleteDate(birthday.id)}
          />
        ) : (
          <AddRow
            title="Add birthday"
            onPress={() =>
              onOpenSheet({
                mode: 'create',
                kind: 'date',
                personId,
                dateLabel: 'Birthday',
              })
            }
          />
        )}
        {otherDates.map((date) => (
          <DateRow
            key={date.id}
            divider
            date={date}
            today={today}
            onPress={() => onOpenSheet({ mode: 'edit', kind: 'date', date })}
            onDelete={() => onDeleteDate(date.id)}
          />
        ))}
        <AddRow
          title="Add date"
          divider
          onPress={() =>
            onOpenSheet({ mode: 'create', kind: 'date', personId })
          }
        />
      </SectionCard>

      <SectionCard
        title="Facts"
        accessory={
          <FactSortMenu
            sort={factSort}
            isOpen={isSortMenuOpen}
            onOpenChange={onSortMenuOpenChange}
            onChange={onFactSortChange}
          />
        }
      >
        {facts.length === 0 ? (
          <View className="flex-row items-center gap-4 px-4 py-4">
            <Abby pose="note" size={84} />
            <Text className="flex-1 text-base leading-6 text-muted-foreground">
              Their coffee order, a favorite flower. Start with one little
              thing.
            </Text>
          </View>
        ) : (
          facts.map((fact, index) => (
            <EntryRow
              key={fact.id}
              divider={index > 0}
              label={fact.label}
              value={fact.value}
              onPress={() => onOpenSheet({ mode: 'edit', kind: 'fact', fact })}
              onDelete={() => onDeleteFact(fact.id)}
            />
          ))
        )}
        <AddRow
          title="Add fact"
          divider
          onPress={() =>
            onOpenSheet({ mode: 'create', kind: 'fact', personId })
          }
        />
      </SectionCard>
      <GiftSection personId={personId} onOpenSheet={onOpenSheet} />
    </View>
  );
}
