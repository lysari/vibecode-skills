export enum LIST_DATA_TYPE {
    HOMES = "HOMES",
    CARRIER_CODES = "CARRIER_CODES",
    GEO_COUNTRIES = "GEO_COUNTRIES",
    GEO_PROVINCE = "GEO_PROVINCE",
    GEO_DISTRICT = "GEO_DISTRICT",
    GEO_COMMUNE = "GEO_COMMUNE",
    GEO_VILLAGE = "GEO_VILLAGE",
    GEO_CITY = "GEO_CITY",
    GOOD_UNIT = "GOOD_UNIT",
    GOOD_CURRENCY = "GOOD_CURRENCY",
    TRAVEL_PURPOSE = "TRAVEL_PURPOSE",
    OCCUPATION = "OCCUPATION",
    PORT_OF_ENTRY = "PORT_OF_ENTRY",
    PASSPORT_TYPE = "PASSPORT_TYPE",
    PHONE_COUNTRIES = "PHONE_COUNTRIES",
    TICKET_TOPICS = "TICKET_TOPICS",
}
import { IFile } from './storage.interface';

/* ─────────────────────────────────────────────────────────────
   Value shapes
   ───────────────────────────────────────────────────────────── */

/**
 * The shape `toSmallObj` produces. Which of these carry the label depends on the
 * collection: the gazetteer uses name/en_name, `occupations` uses name_kh/name_en.
 */
export interface ISelectValue {
  key?: string | number | null
  text?: string | null
  name?: string | null
  en_name?: string | null
  name_en?: string | null
  name_kh?: string | null
}

export interface ICountryValue extends ISelectValue {
  alpha_3_code?: string | null
  en_short_name?: string | null
  kh_short_name?: string | null
  en_nationality?: string | null
  kh_nationality?: string | null
}

export interface IFieldOption {
  key: number
  labelKey: string
}

/** An attachment slot is an option that names which document was uploaded into it. */
export type IDocType = IFieldOption

export type IAttachment = IFile & { docType: IDocType }

/** DOB only — age is derived at print time, never stored. */
export interface IRelatedPerson {
  nameKm?: string | null
  nameLatin?: string | null
  dateOfBirth?: Date | null
  nationality?: ICountryValue | null
  occupation?: ISelectValue | null
}

/* ─────────────────────────────────────────────────────────────
   Identity — merged from the enrollment user doc, never collected
   ───────────────────────────────────────────────────────────── */

/**
 * Exactly what `mapStateToPassport` merges from the user doc. The MRZ scan that produced
 * these ran once, at enrollment, so no service re-collects them and none of them is a
 * form field. Replaces `IProfileState`, the e-Arrival traveller shape, which misses the
 * Khmer names and requires socialOption/socialText.
 */
export interface IEidIdentityState {
  surname?: string | null           // Latin, uppercase — matches arrival naming
  givenName?: string | null
  surnameKh?: string | null
  givenNameKh?: string | null
  fullName?: string | null
  fullNameKh?: string | null        // Khmer order puts the surname first

  gender?: any
  dateOfBirth?: Date | null
  dob_key?: number | null
  nationality?: ICountryValue | null
  birthCountry?: ICountryValue | null

  passportNumber?: string | null    // the enrolled identity document, ID card or passport
  passportExpiry?: Date | null

  phoneCountryCode?: any
  phoneNumber?: string | null
  photo?: any
}

/* ─────────────────────────────────────────────────────────────
   Collected state — composable slices, what the citizen fills in
   ───────────────────────────────────────────────────────────── */

interface IPassportServiceState {
  passportValidity?: ISelectValue | null
}

interface IPassportContactState {
  occupation?: ISelectValue | null
  email?: string | null
  emergencyContactName?: string | null
  emergencyContactRelationship?: string | null
  emergencyPhoneNumber?: string | null
  emergencyContactAddress?: string | null
  /** Picked beside the number, and stored apart from it. */
  emergencyPhoneCountryCode?: ISelectValue | null
}

/** Cambodian administrative hierarchy — codes, not free text. */
interface IKhmerGeoState {
  province?: ISelectValue | null    // toGeoObj
  district?: ISelectValue | null
  commune?: ISelectValue | null
  village?: ISelectValue | null
}

interface IPlaceOfBirthState {
  pobProvince?: ISelectValue | null
  pobDistrict?: ISelectValue | null
  pobCommune?: ISelectValue | null
  pobVillage?: ISelectValue | null
}

interface ICurrentAddressState extends IKhmerGeoState {
  houseNo?: string | null
  street?: string | null
}

interface IPassportFamilyState {
  father?: IRelatedPerson | null
  mother?: IRelatedPerson | null
  maritalStatus?: ISelectValue | null
  spouse?: IRelatedPerson | null
}

interface IPassportHistoryState {
  prevPassportNumber?: string | null
  prevPassportIssueDate?: Date | null
  prevPassportIssuePlace?: string | null
}

interface IPassportDocumentState {
  photoFile?: IFile | null
  attachments?: IAttachment[] | null
}

/** Everything the form collects, and nothing else. */
export interface IPassportCollectedState
  extends IPassportServiceState,
  IPassportContactState,
  IPlaceOfBirthState,
  ICurrentAddressState,
  IPassportFamilyState,
  IPassportHistoryState,
  IPassportDocumentState { }

export interface IPassportFormState extends IPassportCollectedState { }

/* ─────────────────────────────────────────────────────────────
   Field paths — one level of nesting, so ids are 'father.nameKm'
   ───────────────────────────────────────────────────────────── */

/** The collected keys holding an `IRelatedPerson` rather than a scalar. */
type PassportGroupId = 'father' | 'mother' | 'spouse'

type PassportRelatedKey = keyof IRelatedPerson & string

/**
 * Every addressable field. Listed explicitly rather than inferred: `IRelatedPerson` has
 * only optional members, so a structural test would match `ISelectValue` too and treat
 * every picker as a group.
 */
export type PassportPath =
  | Exclude<keyof IPassportCollectedState & string, PassportGroupId>
  | `${PassportGroupId}.${PassportRelatedKey}`

/* ─────────────────────────────────────────────────────────────
   Services and steps
   ───────────────────────────────────────────────────────────── */

export type PassportServiceKey = 'APPLY_NEW' | 'RENEW' | 'LOST' | 'DAMAGED'

export type PassportStepKey = 'profile' | 'family' | 'documents'

export const PASSPORT_STEP_ORDER: readonly PassportStepKey[] = ['profile', 'family', 'documents']

export const PASSPORT_STEP_TITLES: Record<PassportStepKey, string> = {
  profile: 'stepPersonalInfo',
  family: 'stepFamily',
  documents: 'stepDocuments',
}

/** The services that replace an existing passport rather than issue a first one. */
export const REPLACEMENT_SERVICES: readonly PassportServiceKey[] = ['RENEW', 'LOST', 'DAMAGED']

/**
 * Any one of these is accepted as proof, so none is individually required — the
 * `attachments` field is satisfied by a file against any type.
 */
export const DOCUMENT_TYPES: readonly IDocType[] = [
  { key: 0, labelKey: 'docNationalId' },
  { key: 1, labelKey: 'docBirthCertificate' },
  { key: 2, labelKey: 'docFamilyBook' },
  { key: 3, labelKey: 'docResidency' },
]

export const MARITAL_OPTIONS: readonly IFieldOption[] = [
  { key: 0, labelKey: 'maritalSingle' },
  { key: 1, labelKey: 'maritalMarried' },
  { key: 2, labelKey: 'maritalDivorced' },
  { key: 3, labelKey: 'maritalWidowed' },
]

export const MARITAL_MARRIED_KEY = 1

export const VALIDITY_OPTIONS: readonly IFieldOption[] = [
  { key: 1, labelKey: 'passportValidity1Year' },
  { key: 10, labelKey: 'passportValidity10Years' },
]

/* ─────────────────────────────────────────────────────────────
   Field table
   ───────────────────────────────────────────────────────────── */

export type PassportFieldType = 'text' | 'khmer' | 'date' | 'select' | 'lookup' | 'email' | 'phone' | 'file' | 'attachments'

/**
 * `scope` decides where the value is persisted: profile fields are stored once against the
 * citizen and reused by every future service, application fields belong to this request.
 * `step` plus position in PASSPORT_FIELD_LIST decides where it is asked, so there is no
 * second list of ids to keep in sync.
 */
export interface IPassportFieldDef {
  id: PassportPath
  step: PassportStepKey
  type: PassportFieldType
  labelKey: string
  scope: 'profile' | 'application'
  optional?: boolean
  uppercase?: boolean
  /** A fixed-width pattern the field types itself into — see `x-liquid-input`. */
  mask?: string
  /**
   * Where a `phone` field keeps the dialling code it is asked for beside the
   * number. The two are drawn as one field and stored as two, because that is
   * what the record holds.
   */
  codeId?: PassportPath
  listType?: LIST_DATA_TYPE
  parent?: PassportPath
  /** Country pickers that ask for a nationality ("Cambodian"), not a country ("Cambodia"). */
  isNationality?: boolean
  /** File fields that show their requirements before opening the picker. */
  instructions?: boolean
  options?: readonly IFieldOption[]
  /** The slots an `attachments` field offers, one upload area each. */
  docTypes?: readonly IDocType[]
  sectionKey?: string
  /** The services that ask for this field; every service when omitted. */
  services?: readonly PassportServiceKey[]
  visibleWhen?: (form: IPassportFormState) => boolean
}

const isMarried = (form: IPassportFormState): boolean => form.maritalStatus?.key === MARITAL_MARRIED_KEY

/** Declaration order is render order. */
export const PASSPORT_FIELD_LIST = [
  { id: 'photoFile', step: 'profile', type: 'file', labelKey: 'passportPhotoLabel', scope: 'application', instructions: true },
  { id: 'occupation', step: 'profile', type: 'lookup', labelKey: 'occupation', scope: 'profile', listType: LIST_DATA_TYPE.OCCUPATION },
  { id: 'email', step: 'profile', type: 'email', labelKey: 'email', scope: 'profile', optional: true },

  { id: 'pobProvince', step: 'profile', type: 'lookup', labelKey: 'province', scope: 'profile', listType: LIST_DATA_TYPE.GEO_PROVINCE, sectionKey: 'placeOfBirthSection' },
  { id: 'pobDistrict', step: 'profile', type: 'lookup', labelKey: 'district', scope: 'profile', listType: LIST_DATA_TYPE.GEO_DISTRICT, parent: 'pobProvince' },
  { id: 'pobCommune', step: 'profile', type: 'lookup', labelKey: 'commune', scope: 'profile', listType: LIST_DATA_TYPE.GEO_COMMUNE, parent: 'pobDistrict' },
  { id: 'pobVillage', step: 'profile', type: 'lookup', labelKey: 'village', scope: 'profile', listType: LIST_DATA_TYPE.GEO_VILLAGE, parent: 'pobCommune' },

  { id: 'province', step: 'profile', type: 'lookup', labelKey: 'province', scope: 'profile', listType: LIST_DATA_TYPE.GEO_PROVINCE, sectionKey: 'currentAddressSection' },
  { id: 'district', step: 'profile', type: 'lookup', labelKey: 'district', scope: 'profile', listType: LIST_DATA_TYPE.GEO_DISTRICT, parent: 'province' },
  { id: 'commune', step: 'profile', type: 'lookup', labelKey: 'commune', scope: 'profile', listType: LIST_DATA_TYPE.GEO_COMMUNE, parent: 'district' },
  { id: 'village', step: 'profile', type: 'lookup', labelKey: 'village', scope: 'profile', listType: LIST_DATA_TYPE.GEO_VILLAGE, parent: 'commune' },
  { id: 'houseNo', step: 'profile', type: 'text', labelKey: 'homeNo', scope: 'profile' },
  { id: 'street', step: 'profile', type: 'text', labelKey: 'streetNo', scope: 'profile', optional: true },

  { id: 'father.nameKm', step: 'family', type: 'khmer', labelKey: 'fatherNameKh', scope: 'profile', sectionKey: 'fatherSection' },
  { id: 'father.nameLatin', step: 'family', type: 'text', labelKey: 'fatherNameLatin', scope: 'profile', uppercase: true },
  { id: 'father.dateOfBirth', step: 'family', type: 'date', labelKey: 'fatherDateOfBirth', scope: 'profile' },
  { id: 'father.nationality', step: 'family', type: 'lookup', labelKey: 'fatherNationality', scope: 'profile', listType: LIST_DATA_TYPE.GEO_COUNTRIES, isNationality: true },
  { id: 'father.occupation', step: 'family', type: 'lookup', labelKey: 'fatherOccupation', scope: 'profile', listType: LIST_DATA_TYPE.OCCUPATION },

  { id: 'mother.nameKm', step: 'family', type: 'khmer', labelKey: 'motherNameKh', scope: 'profile', sectionKey: 'motherSection' },
  { id: 'mother.nameLatin', step: 'family', type: 'text', labelKey: 'motherNameLatin', scope: 'profile', uppercase: true },
  { id: 'mother.dateOfBirth', step: 'family', type: 'date', labelKey: 'motherDateOfBirth', scope: 'profile' },
  { id: 'mother.nationality', step: 'family', type: 'lookup', labelKey: 'motherNationality', scope: 'profile', listType: LIST_DATA_TYPE.GEO_COUNTRIES, isNationality: true },
  { id: 'mother.occupation', step: 'family', type: 'lookup', labelKey: 'motherOccupation', scope: 'profile', listType: LIST_DATA_TYPE.OCCUPATION },

  { id: 'maritalStatus', step: 'family', type: 'select', labelKey: 'maritalStatus', scope: 'profile', options: MARITAL_OPTIONS, sectionKey: 'spouseSection' },
  { id: 'spouse.nameKm', step: 'family', type: 'khmer', labelKey: 'spouseNameKh', scope: 'profile', visibleWhen: isMarried },
  { id: 'spouse.nameLatin', step: 'family', type: 'text', labelKey: 'spouseNameLatin', scope: 'profile', uppercase: true, visibleWhen: isMarried },
  { id: 'spouse.dateOfBirth', step: 'family', type: 'date', labelKey: 'spouseDateOfBirth', scope: 'profile', visibleWhen: isMarried },
  { id: 'spouse.nationality', step: 'family', type: 'lookup', labelKey: 'spouseNationality', scope: 'profile', listType: LIST_DATA_TYPE.GEO_COUNTRIES, isNationality: true, visibleWhen: isMarried },

  { id: 'passportValidity', step: 'documents', type: 'select', labelKey: 'passportValidity', scope: 'application', options: VALIDITY_OPTIONS },
  { id: 'prevPassportNumber', step: 'documents', type: 'text', labelKey: 'previousPassportNo', scope: 'application', uppercase: true, sectionKey: 'previousPassportSection', services: REPLACEMENT_SERVICES },
  { id: 'prevPassportIssueDate', step: 'documents', type: 'date', labelKey: 'previousPassportIssueDate', scope: 'application', services: REPLACEMENT_SERVICES },
  { id: 'prevPassportIssuePlace', step: 'documents', type: 'text', labelKey: 'previousPassportIssuePlace', scope: 'application', services: REPLACEMENT_SERVICES },
  { id: 'emergencyContactName', step: 'documents', type: 'text', labelKey: 'emergencyContactName', scope: 'application', sectionKey: 'emergencyContactSection' },
  { id: 'emergencyContactRelationship', step: 'documents', type: 'text', labelKey: 'emergencyContactRelationship', scope: 'application' },
  { id: 'emergencyPhoneNumber', step: 'documents', type: 'phone', labelKey: 'emergencyContactPhone', scope: 'application', mask: '000 000 000', codeId: 'emergencyPhoneCountryCode' },
  { id: 'emergencyContactAddress', step: 'documents', type: 'text', labelKey: 'emergencyContactAddress', scope: 'application' },
  // Only a verified citizen reaches this form, and verification already ran an MRZ scan of
  // their National ID — so a first passport has nothing left to prove with a fresh
  // ID/birth-certificate/family-book upload. A replacement is about the passport itself,
  // not the citizen's identity, so it still asks.
  { id: 'attachments', step: 'documents', type: 'attachments', labelKey: 'supportDocumentHint', scope: 'application', sectionKey: 'supportDocumentSection', docTypes: DOCUMENT_TYPES, services: REPLACEMENT_SERVICES },
] as const satisfies readonly IPassportFieldDef[]

/** Only the paths the table actually declares — `spouse.occupation` is not one of them. */
export type PassportFieldId = typeof PASSPORT_FIELD_LIST[number]['id']

export type TErrorPassportForm = Partial<Record<PassportFieldId, string>>

/**
 * What consumers see. `IPassportFieldDef` accepts any valid `PassportPath` so the table can
 * be authored and checked; once authored, only declared ids exist, and every handler is
 * keyed on those.
 */
export type IPassportField = Omit<IPassportFieldDef, 'id' | 'parent'> & {
  id: PassportFieldId
  parent?: PassportFieldId
}

/** The same list, widened: `as const` narrows each element past its optional members. */
const FIELD_DEFS: readonly IPassportField[] = PASSPORT_FIELD_LIST

export const PASSPORT_FIELDS = FIELD_DEFS.reduce((acc, def) => {
  acc[def.id] = def
  return acc
}, {} as Record<PassportFieldId, IPassportField>)

/** The fields this step asks this service for, in declaration order. */
export function modifyPassportField(
  step: PassportStepKey,
  service: PassportServiceKey,
  form: IPassportFormState,
): IPassportField[] {
  return FIELD_DEFS.filter(def => (
    def.step === step
    && (!def.services || def.services.includes(service))
    && (!def.visibleWhen || def.visibleWhen(form))
  ))
}

/* ─────────────────────────────────────────────────────────────
   Path access — the cost of nesting father/mother/spouse
   ───────────────────────────────────────────────────────────── */

/** The top-level key a path is stored under: 'father.nameKm' → 'father'. */
export function fieldRoot(id: PassportFieldId): keyof IPassportCollectedState {
  return id.split('.')[0] as keyof IPassportCollectedState
}

/**
 * Keyed on a path rather than a declared id: a field can name a companion the
 * record holds but nobody asks for on its own — the dialling code beside an
 * emergency number. Everything that is *asked* is still a `PassportFieldId`.
 */
export function getFieldValue(form: IPassportFormState, id: PassportPath): unknown {
  const [root, leaf] = id.split('.')
  const value = form[root as keyof IPassportCollectedState]
  if (!leaf) return value
  return (value as IRelatedPerson | null | undefined)?.[leaf as PassportRelatedKey]
}

/** Returns a new form — the nested group is copied, never mutated in place. */
export function setFieldValue(
  form: IPassportFormState,
  id: PassportPath,
  value: unknown,
): IPassportFormState {
  const [root, leaf] = id.split('.')
  if (!leaf) return { ...form, [root]: value }

  const group = (form[root as keyof IPassportCollectedState] || {}) as IRelatedPerson
  return { ...form, [root]: { ...group, [leaf]: value } }
}

/* ─────────────────────────────────────────────────────────────
   The application document
   ───────────────────────────────────────────────────────────── */

/**
 * One document per application, alongside the citizen profile `savePassport` merges into —
 * there is no header/detail pair here, unlike `IArrival`. Collected values are not flat on
 * the document: application-scope fields live under `extras`, profile-scope fields under
 * `profileSnapshot`, frozen at submit so a later profile correction cannot rewrite what
 * GDI reviewed.
 */
export interface IPassport extends IEidIdentityState {
  key: string
  uid: string
  pageKey: number

  service?: PassportServiceKey | null   // the routing key the menu and field table use
  serviceType?: ISelectValue | null     // PASSPORT_SERVICE_OBJ — the indexed form, 1..4
  service_type?: string | null          // 'passport' — the collection is shared with other GDI services

  application_no?: string | number | null
  application_date?: any
  extras?: Partial<IPassportCollectedState> | null
  profileSnapshot?: Partial<IPassportCollectedState> | null
  snapshot_at?: any

  status: any
  isDeleted: boolean
  keywords: string[]

  created_at: any
  created_by: any
  createdDateKey: number
  updated_at: any
  updated_by: any
}

/**
 * The citizen profile document: the profile-scope subset, stored once and reused by every
 * future service.
 */
export interface ICitizenProfile extends Partial<IPassportCollectedState> {
  key: string
  updated_at: any
  updated_by: any
}

/* ─────────────────────────────────────────────────────────────
   Component props
   ───────────────────────────────────────────────────────────── */

export interface IPassportComponentProps {
  form: IPassportFormState
  formError: TErrorPassportForm
  service: PassportServiceKey
  onSetState: (id: PassportFieldId, value: unknown) => void
  onSelectData: (id: PassportFieldId) => void
  onAttachFile: (id: PassportFieldId, docType?: IDocType) => void
  onDatePicker: (id: PassportFieldId) => void
  onActionSheetType: (id: PassportFieldId) => void
}
