import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { LiquidAutocomplete } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete';
import { LiquidAutocompleteOption } from '@app/shared/components/liquid-autocomplete/liquid-autocomplete-option.directive';
import { LiquidMenuCloseReason } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { FakeSubService, fakeSubServices, lookupOptions } from '@app/shared/constants/fake';
import { SERVICE_ICONS } from '@app/shared/constants/service-icons';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { ISelectValue, LIST_DATA_TYPE } from '@app/shared/interfaces/passport.interface';
import { Section } from '../liquid-input-docs/liquid-input-docs.reference';
import {
  AUTOCOMPLETE_API,
  AUTOCOMPLETE_CSS,
  AUTOCOMPLETE_FORMS,
  AUTOCOMPLETE_GROUPS,
  AUTOCOMPLETE_MEMBERS,
  AUTOCOMPLETE_OPTION_CONTEXT,
  AUTOCOMPLETE_OUTPUTS,
  AUTOCOMPLETE_SETUP,
  AUTOCOMPLETE_TEMPLATE,
} from './liquid-autocomplete-docs.reference';

type SubService = FakeSubService & { service: string };

/** The documentation for `<x-liquid-autocomplete>`, on the real component. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LiquidAutocomplete,
    LiquidAutocompleteOption,
    LiquidPressable,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  providers: [provideIcons(SERVICE_ICONS)],
  selector: 'app-liquid-autocomplete-docs',
  styleUrls: [
    '../liquid-input-docs/liquid-input-docs.scss',
    './liquid-autocomplete-docs.scss',
  ],
  templateUrl: './liquid-autocomplete-docs.html',
})
export class LiquidAutocompleteDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly setup = AUTOCOMPLETE_SETUP;
  protected readonly groupsSetup = AUTOCOMPLETE_GROUPS;
  protected readonly templateSetup = AUTOCOMPLETE_TEMPLATE;
  protected readonly formsSetup = AUTOCOMPLETE_FORMS;
  protected readonly api = AUTOCOMPLETE_API;
  protected readonly outputs = AUTOCOMPLETE_OUTPUTS;
  protected readonly members = AUTOCOMPLETE_MEMBERS;
  protected readonly optionContext = AUTOCOMPLETE_OPTION_CONTEXT;
  protected readonly cssApi = AUTOCOMPLETE_CSS;

  protected readonly provinces = lookupOptions(LIST_DATA_TYPE.GEO_PROVINCE);
  protected readonly occupations = lookupOptions(LIST_DATA_TYPE.OCCUPATION);
  protected readonly countries = lookupOptions(LIST_DATA_TYPE.GEO_COUNTRIES);
  protected readonly subServices = fakeSubServices;

  protected readonly optionName = (item: ISelectValue | SubService): string => item.name ?? '';
  protected readonly optionCaption = (item: ISelectValue | SubService): string =>
    item.name_en ?? '';
  /** A value restored from a draft is a copy, never the same object as the option. */
  protected readonly sameKey = (a: ISelectValue, b: ISelectValue): boolean => a.key === b.key;
  protected readonly serviceOf = (item: SubService): string => item.service;
  protected readonly iconOf = (item: SubService): string => item.icon;
  protected readonly asOption = (option: unknown): ISelectValue => option as ISelectValue;
  protected readonly isStudent = (item: ISelectValue): boolean => item.key === 'student';

  protected readonly province = signal<ISelectValue | null>(null);
  protected readonly subService = signal<SubService | null>(null);
  protected readonly country = signal<ISelectValue | null>(null);
  protected readonly events = signal<string[]>([]);

  protected readonly provinceControl = new FormControl<ISelectValue | null>(
    null,
    Validators.required,
  );
  protected occupation: ISelectValue | null = null;

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'groups', title: 'Search and groups' },
    { id: 'template', title: 'Option template' },
    { id: 'states', title: 'States' },
    { id: 'forms', title: 'Forms' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected log(event: string, reason?: LiquidMenuCloseReason): void {
    const line = reason ? `${event}: ${reason}` : event;
    this.events.update((list) => [line, ...list].slice(0, 6));
  }

  protected touchAll(): void {
    this.provinceControl.markAsTouched();
  }

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    view?.history.replaceState(null, '', `${view.location.pathname}#${id}`);
  }
}
