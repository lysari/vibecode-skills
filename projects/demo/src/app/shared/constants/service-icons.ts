/**
 * Every glyph the service catalogue names, ready to hand to `provideIcons`.
 *
 * `fake.ts` names its icons as strings, and a string cannot pull an icon into
 * the bundle — each consumer has to import the glyph itself and register it.
 * There are three of them (the home page's tabs and cards, the header's
 * add-service menu, the sidebar's service list), and for a while they each kept
 * their own hand-written list. That only works until the catalogue changes:
 * renaming the icons here left the header and the sidebar registering names
 * nothing used any more and missing the ones that had replaced them, which
 * `ng-icon` reports as a console warning and an empty box rather than a build
 * error.
 *
 * So the list lives once, beside the catalogue that decides it.
 * `service-icons.spec.ts` fails the build if the two ever drift apart again.
 */

import {
  ionAddCircle,
  ionAirplane,
  ionAlertCircle,
  ionApps,
  ionBandage,
  ionBody,
  ionBook,
  ionBriefcase,
  ionBusiness,
  ionCarSport,
  ionCash,
  ionCopy,
  ionCreate,
  ionDocumentLock,
  ionDocumentText,
  ionDocuments,
  ionFlash,
  ionFlower,
  ionGlobe,
  ionHeart,
  ionHeartDislike,
  ionHome,
  ionHourglass,
  ionIdCard,
  ionJournal,
  ionLocation,
  ionPeople,
  ionPersonAdd,
  ionPersonRemove,
  ionRefresh,
  ionRibbon,
  ionShieldCheckmark,
  ionSync,
} from '@ng-icons/ionicons';

export const SERVICE_ICONS = {
  ionAddCircle,
  ionAirplane,
  ionAlertCircle,
  ionApps,
  ionBandage,
  ionBody,
  ionBook,
  ionBriefcase,
  ionBusiness,
  ionCarSport,
  ionCash,
  ionCopy,
  ionCreate,
  ionDocumentLock,
  ionDocumentText,
  ionDocuments,
  ionFlash,
  ionFlower,
  ionGlobe,
  ionHeart,
  ionHeartDislike,
  ionHome,
  ionHourglass,
  ionIdCard,
  ionJournal,
  ionLocation,
  ionPeople,
  ionPersonAdd,
  ionPersonRemove,
  ionRefresh,
  ionRibbon,
  ionShieldCheckmark,
  ionSync,
};
