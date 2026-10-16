import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IFile } from '@app/shared/interfaces/storage.interface';
import { MB } from '@app/shared/utils/file-preview';
import { LiquidUpload, LiquidUploadRejection } from '@app/shared/components/liquid-upload/liquid-upload';

@Component({
  imports: [LiquidUpload, ReactiveFormsModule],
  template: `
    <x-liquid-upload
      inputId="doc"
      label="Birth certificate"
      [maxSize]="maxSize"
      [(value)]="value"
      (rejected)="rejections.push($event)"
    />
    <x-liquid-upload inputId="form" label="Family book" [hint]="false" [formControl]="control" />
  `,
})
class Host {
  readonly maxSize = 1 * MB;
  readonly value = signal<IFile | null>(null);
  readonly control = new FormControl<IFile | null>(null);
  readonly rejections: LiquidUploadRejection[] = [];
}

const pdf = (name = 'scan.pdf', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

describe('LiquidUpload', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;
  let uploads: LiquidUpload[];

  const field = (id: string) =>
    element.querySelector<HTMLElement>(`#${id}`)!.closest('x-liquid-upload')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
    uploads = fixture.debugElement
      .queryAll(By.directive(LiquidUpload))
      .map((debug) => debug.componentInstance as LiquidUpload);
  });

  it('starts empty: a Browse button named for the file, and what it may be under it', () => {
    const button = element.querySelector<HTMLButtonElement>('#doc')!;
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent?.trim()).toBe('Browse');
    expect(button.getAttribute('aria-label')).toBe('Birth certificate, Browse');
    expect(field('doc').querySelector('.liquid-upload-placeholder')?.textContent).toBe(
      'No file chosen',
    );
    expect(field('doc').querySelector('.liquid-upload-hint')?.textContent).toContain('PDF');
  });

  it('leaves the limits out when a group says them once for all its fields', () => {
    expect(field('form').querySelector('.liquid-upload-hint')).toBeNull();
    expect(element.querySelector('#form')?.getAttribute('aria-describedby')).not.toContain('-hint');
    expect(element.querySelector('#doc')?.getAttribute('aria-describedby')).toContain('doc-hint');
  });

  it('takes a file it accepts, and shows its name and size', async () => {
    await uploads[0].addFile(pdf('birth.pdf', 3 * 1024));
    await fixture.whenStable();

    expect(host.value()?.name).toBe('birth.pdf');
    expect(host.value()?.fileSize).toBe(3 * 1024);
    expect(field('doc').classList).toContain('has-file');
    expect(element.querySelector('.liquid-upload-pdf')?.textContent).toBe('PDF');
    expect(field('doc').querySelector('.liquid-upload-name')?.textContent).toBe('birth.pdf');
    expect(field('doc').querySelector('.liquid-upload-size')?.textContent).toMatch(/^3\s?kB$/);
    expect(element.querySelector('#doc')?.textContent?.trim()).toBe('Replace');
  });

  it('refuses a type it does not accept, keeps what it held, and says why', async () => {
    await uploads[0].addFile(pdf());
    await uploads[0].addFile(new File(['x'], 'notes.txt', { type: 'text/plain' }));
    await fixture.whenStable();

    expect(host.value()?.name).toBe('scan.pdf');
    expect(host.rejections.map((rejection) => rejection.reason)).toEqual(['type']);
    const alert = element.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain("isn't accepted");
    expect(field('doc').classList).toContain('is-invalid');
  });

  it('refuses a file over `maxSize`', async () => {
    await uploads[0].addFile(pdf('big.pdf', 2 * MB));
    await fixture.whenStable();

    expect(host.value()).toBeNull();
    expect(host.rejections[0].reason).toBe('size');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('too large');
  });

  it('says so when an image cannot be decoded', async () => {
    // jsdom has no image decoder, which is exactly the path a corrupt photo takes.
    await uploads[0].addFile(new File(['not really'], 'photo.jpg', { type: 'image/jpeg' }));
    await fixture.whenStable();

    expect(host.value()).toBeNull();
    expect(host.rejections[0].reason).toBe('read');
  });

  it('clears the message once a good file follows a bad one', async () => {
    await uploads[0].addFile(pdf('big.pdf', 2 * MB));
    await uploads[0].addFile(pdf());
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(field('doc').classList).not.toContain('is-invalid');
  });

  it('removes the file and hands the field back empty', async () => {
    await uploads[0].addFile(pdf());
    await fixture.whenStable();
    field('doc').querySelector<HTMLButtonElement>('.liquid-upload-clear')!.click();
    await fixture.whenStable();

    expect(host.value()).toBeNull();
    expect(element.querySelector('#doc')?.textContent?.trim()).toBe('Browse');
    expect(field('doc').querySelector('.liquid-upload-clear')).toBeNull();
  });

  it('shows the drop cue only while files are dragged over it', async () => {
    const drag = (type: string, types = ['Files']) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: { types, files: [], dropEffect: 'none' },
      });
      field('doc').querySelector('.liquid-upload-field')!.dispatchEvent(event);
    };

    drag('dragenter', ['text/plain']);
    await fixture.whenStable();
    expect(field('doc').classList).not.toContain('is-dragging');

    drag('dragenter');
    await fixture.whenStable();
    expect(field('doc').classList).toContain('is-dragging');

    drag('dragleave');
    await fixture.whenStable();
    expect(field('doc').classList).not.toContain('is-dragging');
  });

  it('opens the picker from anywhere on the field, but not from its own buttons', async () => {
    const picker = field('doc').querySelector<HTMLInputElement>('input[type="file"]')!;
    let opened = 0;
    picker.addEventListener('click', (event) => {
      opened++;
      event.preventDefault();
    });

    field('doc').querySelector<HTMLElement>('.liquid-upload-text')!.click();
    expect(opened).toBe(1);

    // Browse opens it once, not once for itself and again for the field around it.
    element.querySelector<HTMLButtonElement>('#doc')!.click();
    expect(opened).toBe(2);
  });

  it('is a form control: writes, reads, touches and disables', async () => {
    host.control.setValue({
      downloadUrl: '',
      fileSize: 1024,
      fileType: 'application/pdf',
      filename: 'book.pdf',
      key: 'k',
      name: 'book.pdf',
      type: 'application/pdf',
    });
    await fixture.whenStable();
    expect(field('form').textContent).toContain('book.pdf');

    await uploads[1].addFile(pdf('other.pdf'));
    expect(host.control.value?.name).toBe('other.pdf');
    expect(host.control.touched).toBe(true);

    host.control.disable();
    await fixture.whenStable();
    expect(field('form').classList).toContain('is-disabled');
  });
});
