/**
 * Placeholder service catalogue.
 *
 * Stands in for the ministry's real catalogue until an API serves it, so the
 * menus, tabs and search have something with the right shape and depth to
 * render. Khmer is the source text here (`name`), with `name_en` alongside it —
 * because this data never goes through `$localize`: it is thrown away with the
 * mock.
 *
 * Every other placeholder lives here too: the status vocabulary and the sample
 * passport applications (see docs/applications-data.md).
 */
import { ISelectValue, LIST_DATA_TYPE } from '@app/shared/interfaces/passport.interface';
import { IFile } from '@app/shared/interfaces/storage.interface';
import { accentHue } from '@app/shared/utils/accent';
import { Images } from './images';

/** One step inside a main service — what a card or menu row links to. */
export interface FakeSubService {
  /** `@for` track key, unique within its parent. */
  key: string;
  name: string;
  name_en: string;
  /** Registered `ng-icon` name. */
  icon: string;
  path: string;
  /** Official fee in riel; 0 is a free service. */
  fee: number;
  /** Working days the counter quotes for it. */
  days: number;
}

/** A top-level service — the five entries the home page promotes. */
export interface FakeService {
  key: string;
  name: string;
  name_en: string;
  caption: string;
  caption_en: string;
  icon: string;
  path: string;
  /**
   * OKLCH hue in degrees, 0–360, that tints the whole tab — written as a swatch
   * through {@link accentHue}, which keeps the hue and drops the rest. OKLCH
   * rather than HSL because the stylesheet holds lightness fixed across
   * services, and only a perceptual space keeps white text legible on a warm hue
   * as well as a blue. The swatch is not what gets painted; the comment beside
   * each one says what is.
   */
  accent: number;
  /** Artwork for the featured card, where a real one exists; else `null`. */
  art: string | null;
  children: FakeSubService[];
}

export const fakeServices: FakeService[] = [
  {
    key: 'id-card',
    name: 'អត្តសញ្ញាណប័ណ្ណ',
    name_en: 'Identity card',
    caption: 'ស្នើសុំ បន្តសុពលភាព ឬប្តូរអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែររបស់អ្នក',
    caption_en: 'Apply for, renew or replace your Khmer national identity card',
    icon: 'ionIdCard',
    path: '/services/id-card',
    // cornflower; paints #2757b6 as the tint, #e5f3ff as the wash.
    accent: accentHue('#699cfc'),
    art: Images.khmerID,
    children: [
      {
        key: 'apply',
        name: 'ស្នើសុំអត្តសញ្ញាណប័ណ្ណថ្មី',
        name_en: 'Apply for a new ID card',
        icon: 'ionAddCircle',
        path: '/services/id-card/apply',
        fee: 0,
        days: 15,
      },
      {
        key: 'renew',
        name: 'បន្តសុពលភាពអត្តសញ្ញាណប័ណ្ណ',
        name_en: 'Renew an ID card',
        icon: 'ionSync',
        path: '/services/id-card/renew',
        fee: 0,
        days: 15,
      },
      {
        key: 'lost',
        name: 'រាយការណ៍បាត់អត្តសញ្ញាណប័ណ្ណ',
        name_en: 'Report a lost ID card',
        icon: 'ionAlertCircle',
        path: '/services/id-card/lost',
        fee: 4000,
        days: 20,
      },
      {
        key: 'correction',
        name: 'កែតម្រូវព័ត៌មានលើប័ណ្ណ',
        name_en: 'Correct card details',
        icon: 'ionCreate',
        path: '/services/id-card/correction',
        fee: 4000,
        days: 20,
      },
      {
        key: 'damaged',
        name: 'ស្នើសុំប័ណ្ណជំនួសករណីខូចខាត',
        name_en: 'Replace a damaged card',
        icon: 'ionBandage',
        path: '/services/id-card/damaged',
        fee: 4000,
        days: 20,
      },
      {
        key: 'status',
        name: 'ពិនិត្យស្ថានភាពពាក្យស្នើសុំ',
        name_en: 'Check application status',
        icon: 'ionHourglass',
        path: '/services/id-card/status',
        fee: 0,
        days: 0,
      },
    ],
  },
  {
    key: 'passport',
    name: 'លិខិតឆ្លងដែន',
    name_en: 'Passport',
    caption: 'ស្នើសុំ ឬបន្តសុពលភាពលិខិតឆ្លងដែនកម្ពុជា',
    caption_en: 'Apply for or renew a Cambodian passport',
    icon: 'ionBook',
    path: '/services/passport',
    // coral red; paints #a52931 as the tint, #ffe9e7 as the wash.
    accent: accentHue('#f17070'),
    art: Images.khmerPassport,
    children: [
      {
        key: 'apply',
        name: 'ស្នើសុំលិខិតឆ្លងដែនធម្មតា',
        name_en: 'Apply for an ordinary passport',
        icon: 'ionDocumentLock',
        path: '/services/passport/apply',
        fee: 600000,
        days: 30,
      },
      {
        key: 'express',
        name: 'ស្នើសុំសេវាបន្ទាន់',
        name_en: 'Express passport service',
        icon: 'ionFlash',
        path: '/services/passport/express',
        fee: 1000000,
        days: 7,
      },
      {
        key: 'renew',
        name: 'បន្តសុពលភាពលិខិតឆ្លងដែន',
        name_en: 'Renew a passport',
        icon: 'ionSync',
        path: '/services/passport/renew',
        fee: 600000,
        days: 30,
      },
      {
        key: 'child',
        name: 'លិខិតឆ្លងដែនសម្រាប់កុមារ',
        name_en: 'Passport for a child',
        icon: 'ionBody',
        path: '/services/passport/child',
        fee: 400000,
        days: 30,
      },
      {
        key: 'lost',
        name: 'រាយការណ៍បាត់ ឬខូចខាត',
        name_en: 'Report a lost or damaged passport',
        icon: 'ionAlertCircle',
        path: '/services/passport/lost',
        fee: 800000,
        days: 45,
      },
      {
        key: 'travel-document',
        name: 'ស្នើសុំលិខិតធ្វើដំណើរជំនួស',
        name_en: 'Request an emergency travel document',
        icon: 'ionAirplane',
        path: '/services/passport/travel-document',
        fee: 200000,
        days: 3,
      },
    ],
  },
  {
    key: 'civil-registry',
    name: 'អត្រានុកូលដ្ឋាន',
    name_en: 'Civil registration',
    caption: 'ចុះបញ្ជី និងស្នើសុំសំបុត្រកំណើត អាពាហ៍ពិពាហ៍ និងមរណភាព',
    caption_en: 'Register and request birth, marriage and death certificates',
    icon: 'ionDocuments',
    path: '/services/civil-registry',
    // emerald; paints #00773c as the tint, #dffaea as the wash.
    accent: accentHue('#19bb7d'),
    art: Images.khmerBirthCertificate,
    children: [
      {
        key: 'birth',
        name: 'ចុះបញ្ជីកំណើត និងស្នើសុំសំបុត្រកំណើត',
        name_en: 'Register a birth and request a certificate',
        icon: 'ionDocumentText',
        path: '/services/civil-registry/birth',
        fee: 0,
        days: 10,
      },
      {
        key: 'marriage',
        name: 'ចុះបញ្ជីអាពាហ៍ពិពាហ៍',
        name_en: 'Register a marriage',
        icon: 'ionHeart',
        path: '/services/civil-registry/marriage',
        fee: 20000,
        days: 15,
      },
      {
        key: 'divorce',
        name: 'ចុះបញ្ជីលែងលះ',
        name_en: 'Register a divorce',
        icon: 'ionHeartDislike',
        path: '/services/civil-registry/divorce',
        fee: 20000,
        days: 20,
      },
      {
        key: 'death',
        name: 'ចុះបញ្ជីមរណភាព',
        name_en: 'Register a death',
        icon: 'ionFlower',
        path: '/services/civil-registry/death',
        fee: 0,
        days: 10,
      },
      {
        key: 'family-status',
        name: 'លិខិតបញ្ជាក់ស្ថានភាពគ្រួសារ',
        name_en: 'Family status certificate',
        icon: 'ionPeople',
        path: '/services/civil-registry/family-status',
        fee: 10000,
        days: 7,
      },
      {
        key: 'copy',
        name: 'ស្នើសុំចម្លងឯកសារអត្រានុកូលដ្ឋាន',
        name_en: 'Request a certified copy',
        icon: 'ionCopy',
        path: '/services/civil-registry/copy',
        fee: 10000,
        days: 5,
      },
    ],
  },
  // {
  //   key: 'residence-book',
  //   name: 'សៀវភៅស្នាក់នៅ',
  //   name_en: 'Residence book',
  //   caption: 'គ្រប់គ្រងសៀវភៅស្នាក់នៅ និងព័ត៌មានទីលំនៅរបស់គ្រួសារអ្នក',
  //   caption_en: 'Manage your household residence book and address details',
  //   icon: 'ionHome',
  //   path: '/services/residence-book',
  //   // The gold rule that frames the carnet, sampled off the artwork; paints
  //   // #7d5700 as the tint, #faf2d8 as the wash. The paper's own yellow is hue
  //   // 109, which at the fixed 48% lightness reads olive rather than yellow, and
  //   // the ink is 63, too close to the passport's 22 to tell apart.
  //   accent: accentHue('#bd9b15'),
  //   art: Images.khmerPlaceCertificate,
  //   children: [
  //     {
  //       key: 'apply',
  //       name: 'ស្នើសុំសៀវភៅស្នាក់នៅថ្មី',
  //       name_en: 'Apply for a new residence book',
  //       icon: 'ionJournal',
  //       path: '/services/residence-book/apply',
  //       fee: 15000,
  //       days: 15,
  //     },
  //     {
  //       key: 'add-member',
  //       name: 'បន្ថែមសមាជិកក្នុងគ្រួសារ',
  //       name_en: 'Add a household member',
  //       icon: 'ionPersonAdd',
  //       path: '/services/residence-book/add-member',
  //       fee: 5000,
  //       days: 10,
  //     },
  //     {
  //       key: 'remove-member',
  //       name: 'ដកសមាជិកចេញពីគ្រួសារ',
  //       name_en: 'Remove a household member',
  //       icon: 'ionPersonRemove',
  //       path: '/services/residence-book/remove-member',
  //       fee: 5000,
  //       days: 10,
  //     },
  //     {
  //       key: 'transfer',
  //       name: 'ផ្លាស់ប្តូរអាសយដ្ឋាន',
  //       name_en: 'Change address',
  //       icon: 'ionLocation',
  //       path: '/services/residence-book/transfer',
  //       fee: 10000,
  //       days: 15,
  //     },
  //     {
  //       key: 'certificate',
  //       name: 'លិខិតបញ្ជាក់ទីលំនៅ',
  //       name_en: 'Residence certificate',
  //       icon: 'ionRibbon',
  //       path: '/services/residence-book/certificate',
  //       fee: 10000,
  //       days: 5,
  //     },
  //     {
  //       key: 'replace',
  //       name: 'ស្នើសុំសៀវភៅជំនួសករណីបាត់ ឬខូច',
  //       name_en: 'Replace a lost or damaged book',
  //       icon: 'ionRefresh',
  //       path: '/services/residence-book/replace',
  //       fee: 15000,
  //       days: 15,
  //     },
  //   ],
  // },
  // {
  //   key: 'more',
  //   name: 'សេវាផ្សេងៗទៀត',
  //   name_en: 'Other services',
  //   caption: 'សេវាកម្មរដ្ឋបាល និងច្រកព័ត៌មានផ្សេងទៀតរបស់រាជរដ្ឋាភិបាល',
  //   caption_en: 'Further administrative services and government portals',
  //   icon: 'ionApps',
  //   path: '/services',
  //   // amethyst; paints #6d41a9 as the tint, #f5edff as the wash.
  //   accent: accentHue('#ae84f2'),
  //   art: null,
  //   children: [
  //     {
  //       key: 'driving-licence',
  //       name: 'ស្នើសុំបណ្ណបើកបរ',
  //       name_en: 'Apply for a driving licence',
  //       icon: 'ionCarSport',
  //       path: '/services/driving-licence',
  //       fee: 40000,
  //       days: 20,
  //     },
  //     {
  //       key: 'criminal-record',
  //       name: 'លិខិតបញ្ជាក់អំពីប្រវត្តិរូប',
  //       name_en: 'Criminal record extract',
  //       icon: 'ionShieldCheckmark',
  //       path: '/services/criminal-record',
  //       fee: 15000,
  //       days: 10,
  //     },
  //     {
  //       key: 'work-permit',
  //       name: 'ស្នើសុំលិខិតអនុញ្ញាតការងារ',
  //       name_en: 'Apply for a work permit',
  //       icon: 'ionBriefcase',
  //       path: '/services/work-permit',
  //       fee: 100000,
  //       days: 25,
  //     },
  //     {
  //       key: 'business',
  //       name: 'ចុះបញ្ជីអាជីវកម្ម',
  //       name_en: 'Register a business',
  //       icon: 'ionBusiness',
  //       path: '/services/business-registration',
  //       fee: 400000,
  //       days: 8,
  //     },
  //     {
  //       key: 'tax',
  //       name: 'បង់ពន្ធតាមប្រព័ន្ធអនឡាញ',
  //       name_en: 'File and pay tax online',
  //       icon: 'ionCash',
  //       path: '/services/tax',
  //       fee: 0,
  //       days: 0,
  //     },
  //     {
  //       key: 'evisa',
  //       name: 'ដាក់ពាក្យស្នើសុំ e-Visa',
  //       name_en: 'Apply for an e-Visa',
  //       icon: 'ionGlobe',
  //       path: '/services/evisa',
  //       fee: 150000,
  //       days: 3,
  //     },
  //   ],
  // },
];

/** Flattened catalogue — every step, tagged with the service it belongs to. */
export const fakeSubServices: (FakeSubService & { service: string })[] = fakeServices.flatMap(
  (service) => service.children.map((child) => ({ ...child, service: service.name })),
);

const option = (key: string | number, name: string, name_en: string): ISelectValue => ({
  key,
  name,
  name_en,
  text: name_en,
});

const OCCUPATIONS: ISelectValue[] = [
  option('civil-servant', 'មន្ត្រីរាជការ', 'Civil servant'),
  option('teacher', 'គ្រូបង្រៀន', 'Teacher'),
  option('merchant', 'អាជីវករ', 'Merchant'),
  option('student', 'សិស្ស និស្សិត', 'Student'),
];

const COUNTRIES: ISelectValue[] = [
  option('KHM', 'ខ្មែរ', 'Cambodian'),
  option('THA', 'ថៃ', 'Thai'),
  option('VNM', 'វៀតណាម', 'Vietnamese'),
  option('USA', 'អាមេរិក', 'American'),
];

const PHONE_CODES: ISelectValue[] = [
  { key: '+855', name: '+855', name_en: 'Cambodia', name_kh: 'កម្ពុជា' },
  { key: '+66', name: '+66', name_en: 'Thailand', name_kh: 'ថៃ' },
  { key: '+1', name: '+1', name_en: 'United States', name_kh: 'អាមេរិក' },
];

const PROVINCES: ISelectValue[] = [
  option('01', 'បន្ទាយមានជ័យ', 'Banteay Meanchey'),
  option('08', 'កណ្តាល', 'Kandal'),
  option('12', 'រាជធានីភ្នំពេញ', 'Phnom Penh'),
  option('17', 'សៀមរាប', 'Siem Reap'),
  option('18', 'ព្រះសីហនុ', 'Preah Sihanouk'),
  option('21', 'តាកែវ', 'Takeo'),
];

const province = (key: string): ISelectValue => PROVINCES.find((item) => item.key === key)!;

const LEVEL_NAMES: Partial<Record<LIST_DATA_TYPE, [string, string]>> = {
  [LIST_DATA_TYPE.GEO_DISTRICT]: ['ស្រុក/ខណ្ឌ', 'District'],
  [LIST_DATA_TYPE.GEO_COMMUNE]: ['ឃុំ/សង្កាត់', 'Commune'],
  [LIST_DATA_TYPE.GEO_VILLAGE]: ['ភូមិ', 'Village'],
};

/** The options a lookup offers; a child of an unpicked parent offers none. */
export function lookupOptions(
  listType: LIST_DATA_TYPE | undefined,
  parent?: ISelectValue | null,
): ISelectValue[] {
  switch (listType) {
    case LIST_DATA_TYPE.OCCUPATION:
      return OCCUPATIONS;
    case LIST_DATA_TYPE.GEO_COUNTRIES:
      return COUNTRIES;
    case LIST_DATA_TYPE.GEO_PROVINCE:
      return PROVINCES;
    default: {
      const names = listType && LEVEL_NAMES[listType];
      if (!names || parent?.key == null) return [];
      return [1, 2, 3, 4].map((n) =>
        option(
          `${parent.key}${String(n).padStart(2, '0')}`,
          `${names[0]} ${n}`,
          `${names[1]} ${n}`,
        ),
      );
    }
  }
}


export const FAKE_UPLOADED_PDF: IFile = {
  downloadUrl: '',
  fileSize: 412_000,
  fileType: 'application/pdf',
  filename: 'birth-certificate.pdf',
  key: 'birth-certificate.pdf',
  name: 'birth-certificate.pdf',
  type: 'application/pdf',
};
