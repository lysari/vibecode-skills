import { IFaqItem } from '@app/shared/interfaces/faq.interface';

export const FAQ_ITEMS: IFaqItem[] = [
  {
    key: 'what-is',
    question: $localize`:@@home.faq.whatIs.q:What is Khmer eID?`,
    answer: $localize`:@@home.faq.whatIs.a:Khmer eID is the Royal Government of Cambodia's single digital identity. One account gives you your national ID card, passport and civil records online, and signs you in to the government services that accept it — without carrying paper copies to a counter.`,
    icon: 'ionIdCard',
  },
  {
    key: 'sign-in',
    question: $localize`:@@home.faq.signIn.q:How do I sign in to the website?`,
    answer: $localize`:@@home.faq.signIn.a:Open the Khmer eID app on your phone, tap Scan, and point the camera at the QR code shown on the sign-in page. The website signs you in as soon as you confirm on the phone, so there is no password to type or remember.`,
    icon: 'ionQrCode',
  },
  {
    key: 'app-required',
    question: $localize`:@@home.faq.app.q:Do I need the mobile app?`,
    answer: $localize`:@@home.faq.app.a:Yes. The app holds the key that proves the account is yours, and it is what approves each sign-in. It is free on the App Store, Google Play and AppGallery, and one installation covers both the app and this website.`,
    icon: 'ionPhonePortrait',
  },
  {
    key: 'new-device',
    question: $localize`:@@home.faq.newDevice.q:What happens when I sign in from a new device?`,
    answer: $localize`:@@home.faq.newDevice.a:A device you have not used before has to be approved once. You will be asked to confirm it in the app and to enter your PIN code, and the device is then listed in your account so you can remove it later if you lose it.`,
    icon: 'ionKeypad',
  },
  {
    key: 'security',
    question: $localize`:@@home.faq.security.q:Is my personal data safe?`,
    answer: $localize`:@@home.faq.security.a:Your records stay with the ministry that issued them; the eID only proves who you are when you ask for them. Every sign-in is recorded in your account, so an approval you did not make is visible to you, and you can revoke a device at any time.`,
    icon: 'ionLockClosed',
  },
  {
    key: 'cost',
    question: $localize`:@@home.faq.cost.q:How much does it cost?`,
    answer: $localize`:@@home.faq.cost.a:Creating and using the eID account is free. Individual services set their own official fee — each service card on this page shows the fee and the expected turnaround before you start.`,
    icon: 'ionWallet',
  },
  {
    key: 'language',
    question: $localize`:@@home.faq.language.q:Can I use the site in Khmer?`,
    answer: $localize`:@@home.faq.language.a:Yes. Khmer and English are both official versions of this site, and the switch in the header changes the whole portal, including the documents and receipts you download.`,
    icon: 'ionLanguage',
  },
  {
    key: 'lost-phone',
    question: $localize`:@@home.faq.lostPhone.q:I lost my phone — how do I get back in?`,
    answer: $localize`:@@home.faq.lostPhone.a:Install the app on your new phone and sign in with your ID number and PIN code. If you cannot complete that step, bring your identity card to any registration office and ask for the account to be reissued.`,
    icon: 'ionKey',
  },
];
