import type { ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { shadows } from '~/lib/theme';

function Tip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text
        accessibilityRole="header"
        className="mb-2 px-1 text-base font-medium"
      >
        {title}
      </Text>
      <View
        className="gap-3 rounded-2xl bg-white p-4"
        style={{ borderCurve: 'continuous', boxShadow: shadows.whisper }}
      >
        {children}
      </View>
    </View>
  );
}

function TipText({ children }: { children: ReactNode }) {
  return (
    <Text selectable className="text-base leading-6">
      {children}
    </Text>
  );
}

export default function UsingLapshaScreen() {
  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 p-4 pb-32"
    >
      <Text className="px-1 text-base leading-6 text-muted-foreground">
        A few ways to make your notebook useful. These tips are always available
        offline.
      </Text>

      <Tip title="Remember a detail">
        <TipText>
          In People, tap + to add someone. Open their page and tap Add fact to
          save a preference, a conversation detail, or anything you want to
          remember. Leave the label blank for a free-form note.
        </TipText>
        {Platform.OS === 'android' ? (
          <TipText>
            For quick capture, tap the floating + button. Choose the person
            before saving your fact or date.
          </TipText>
        ) : Number.parseInt(String(Platform.Version), 10) >= 26 ? (
          <TipText>
            For quick capture, tap the + beside the tabs. Choose the person
            before saving your fact or date.
          </TipText>
        ) : null}
      </Tip>

      <Tip title="Keep dates, even without the year">
        <TipText>
          On a person’s page, tap Add birthday or Add date. Turn off Include
          year when you only know the month and day. Home shows upcoming dates;
          birthdays stay first on the person’s page.
        </TipText>
      </Tip>

      <Tip title="Edit and organize">
        <TipText>
          Tap a fact or date to edit it. Swipe it left to reveal Delete, or tap
          the row again to close the action without deleting.
        </TipText>
        <TipText>
          The sort button beside Facts switches between Date added and Last
          modified. The menu at the top of a person’s page lets you change their
          name or photo.
        </TipText>
      </Tip>

      <Tip title="Keep gift ideas for later">
        <TipText>
          On a person’s page, tap Add gift idea to save a thought or link. Open
          a saved gift to update its status. Given gifts move to Previously
          given, where you can reopen them and change the Given on date.
        </TipText>
        {Platform.OS === 'android' ? (
          <TipText>
            You can also capture a gift photo. Ideas saved without a person
            appear in Unsorted gift ideas on Home; open one to assign it later.
          </TipText>
        ) : null}
      </Tip>
    </ScrollView>
  );
}
