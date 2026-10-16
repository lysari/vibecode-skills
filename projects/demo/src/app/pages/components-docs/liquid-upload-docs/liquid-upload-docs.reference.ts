import { ApiRow } from '../liquid-input-docs/liquid-input-docs.reference';

export const UPLOAD_SETUP = `import { LiquidUpload } from '@app/shared/components/liquid-upload/liquid-upload';

@Component({ imports: [LiquidUpload] })

<x-liquid-upload
  label="Birth certificate"
  [(value)]="certificate"
  (picked)="upload($event.rawFile)"
/>`;

export const UPLOAD_PHOTO = `<x-liquid-upload
  variant="photo"
  label="Passport photo"
  accept="image/jpeg,image/png"
  acceptLabel="JPG or PNG"
  [minWidth]="400"
  [minHeight]="500"
  [(value)]="photo"
>
  <ul>…the rules the photo has to meet…</ul>
</x-liquid-upload>`;

export const UPLOAD_RULES = `<x-liquid-upload
  label="Signed form"
  accept="application/pdf"
  acceptLabel="PDF"
  [maxSize]="200 * 1024"
  (rejected)="onRejected($event)"
/>`;

export const UPLOAD_FORMS = `<!-- Reactive -->
<x-liquid-upload label="Birth certificate" [formControl]="certificate" />
certificate = new FormControl<IFile | null>(null, Validators.required);

<!-- Template-driven -->
<x-liquid-upload label="Family book" name="familyBook" required [(ngModel)]="familyBook" />`;

export const UPLOAD_API: ApiRow[] = [
  { name: 'value', type: 'IFile | null', value: 'null', does: 'The file held. Two-way: [(value)].' },
  {
    name: 'label',
    type: 'string',
    value: 'required',
    does: 'What the file is. Names the buttons for a screen reader.',
  },
  {
    name: 'variant',
    type: `'document' | 'photo'`,
    value: `'document'`,
    does: 'document: a thumbnail or PDF badge inside the field. photo: the photo in a round avatar beside it.',
  },
  {
    name: 'accept',
    type: 'string',
    value: `'image/jpeg,image/png,application/pdf'`,
    does: 'The <input accept> list, checked again on every file however it arrived.',
  },
  { name: 'acceptLabel', type: 'string', value: `'JPG, PNG or PDF'`, does: 'accept, worded for people.' },
  { name: 'maxSize', type: 'number', value: '10 MB', does: 'In bytes.' },
  {
    name: 'minWidth / minHeight',
    type: 'number',
    value: '0',
    does: 'The smallest an image may be, in pixels. Not checked for anything else.',
  },
  {
    name: 'hint',
    type: 'boolean',
    value: 'true',
    does: 'Prints the types and size limit under the field. Off for a group that says it once.',
  },
  { name: 'inputId', type: 'string', value: 'generated', does: 'The id of the main button — what a <label for> points at.' },
  { name: 'describedBy', type: 'string | null', value: 'null', does: 'Ids of anything else that describes the field.' },
  { name: 'invalid', type: 'boolean', value: 'false', does: 'Draws the field in its error state.' },
  { name: 'disabled', type: 'boolean', value: 'false', does: 'Also set by a form control’s disable().' },
];

export const UPLOAD_OUTPUTS: ApiRow[] = [
  {
    name: 'picked',
    type: 'ITempFile',
    does: 'A file was taken: the raw File for uploading, with the IFile it became.',
  },
  {
    name: 'rejected',
    type: 'LiquidUploadRejection',
    does: 'A file failed a check. The value is left as it was and the reason is shown under the field.',
  },
];

export const UPLOAD_MEMBERS: ApiRow[] = [
  { name: 'pick()', type: 'void', does: 'Opens the system picker.' },
  { name: 'remove()', type: 'void', does: 'Empties the field and moves focus to Browse.' },
  { name: 'addFile(file)', type: 'Promise<void>', does: 'Checks a file and takes it — what a pick and a drop both end in.' },
  { name: 'focus(options?)', type: 'void', does: 'Focuses the main button.' },
];

export const UPLOAD_REJECTIONS: ApiRow[] = [
  { name: 'type', type: 'accept', does: 'The file’s type is not in the list.' },
  { name: 'size', type: 'maxSize', does: 'The file is larger than the limit.' },
  { name: 'dimensions', type: 'minWidth / minHeight', does: 'An image is smaller than the minimum.' },
  { name: 'read', type: '—', does: 'An image could not be decoded.' },
];

export const UPLOAD_CSS: ApiRow[] = [
  {
    name: '--liquid-upload-hue',
    type: 'OKLCH hue',
    value: 'var(--svc-accent, 262)',
    does: 'The accent of the focus ring and the drop target.',
  },
  { name: '--liquid-upload-height', type: 'length', value: '46px', does: 'The field’s height.' },
  { name: '--liquid-upload-radius', type: 'length', value: '14px', does: 'The field’s corner radius.' },
  {
    name: '--liquid-upload-background / -background-hover',
    type: 'color',
    value: 'app background / #ededf0',
    does: 'The field’s fill, at rest and under the pointer.',
  },
];
