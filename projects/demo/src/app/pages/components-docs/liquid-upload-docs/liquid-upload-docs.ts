import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LiquidUpload,
  LiquidUploadRejection,
} from '@app/shared/components/liquid-upload/liquid-upload';
import { FAKE_UPLOADED_PDF } from '@app/shared/constants/fake';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { IFile, ITempFile } from '@app/shared/interfaces/storage.interface';
import { formatBytes } from '@app/shared/utils/file-preview';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  UPLOAD_API,
  UPLOAD_CSS,
  UPLOAD_FORMS,
  UPLOAD_MEMBERS,
  UPLOAD_OUTPUTS,
  UPLOAD_PHOTO,
  UPLOAD_REJECTIONS,
  UPLOAD_RULES,
  UPLOAD_SETUP,
} from './liquid-upload-docs.reference';

/** The documentation for `<x-liquid-upload>`, on the real component. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LiquidPressable, LiquidUpload, NgTemplateOutlet, ReactiveFormsModule],
  selector: 'app-liquid-upload-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-upload-docs.scss'],
  templateUrl: './liquid-upload-docs.html',
})
export class LiquidUploadDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = UPLOAD_SETUP;
  protected readonly photoSetup = UPLOAD_PHOTO;
  protected readonly rulesSetup = UPLOAD_RULES;
  protected readonly formsSetup = UPLOAD_FORMS;
  protected readonly api = UPLOAD_API;
  protected readonly outputs = UPLOAD_OUTPUTS;
  protected readonly members = UPLOAD_MEMBERS;
  protected readonly rejections = UPLOAD_REJECTIONS;
  protected readonly cssApi = UPLOAD_CSS;

  protected readonly uploaded = FAKE_UPLOADED_PDF;
  protected readonly smallLimit = 200 * 1024;

  protected readonly certificate = signal<IFile | null>(null);
  protected readonly photo = signal<IFile | null>(null);
  protected readonly events = signal<string[]>([]);

  protected readonly certificateControl = new FormControl<IFile | null>(null, Validators.required);
  protected familyBook: IFile | null = null;

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'photo', title: 'Photo' },
    { id: 'rules', title: 'Rules' },
    { id: 'states', title: 'States' },
    { id: 'forms', title: 'Forms' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected describe(file: IFile | null): string {
    return file ? `${file.name} · ${file.type} · ${formatBytes(file.fileSize)}` : 'null';
  }

  protected onPicked(event: ITempFile): void {
    this.log(`picked: ${event.rawFile.name} (${formatBytes(event.size)})`);
  }

  protected onRejected(event: LiquidUploadRejection): void {
    this.log(`rejected · ${event.reason}: ${event.file.name}`);
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }

  private log(line: string): void {
    this.events.update((list) => [line, ...list].slice(0, 6));
  }
}
