import type { ApiRow, Section } from '../liquid-input-docs/liquid-input-docs.reference';

export { ApiRow, Section };

export const INPUT_GROUP_SETUP = `import { LiquidInput } from '@app/shared/components/liquid-input/liquid-input';
import { LiquidInputGroup } from '@app/shared/components/liquid-input-group/liquid-input-group';

@Component({
  imports: [LiquidInput, LiquidInputGroup],
  template: \`
    <x-liquid-input-group label="Contact Phone" [(value)]="phoneData">
      <x-liquid-input bare name="country" width="6ch" [options]="countryCodes" />
      <x-liquid-input bare name="number" mask="000 000 000" placeholder="000 000 000" />
    </x-liquid-input-group>
  \`
})
export class ContactFormComponent {
  phoneData = { country: '+855', number: '12345678' };
}`;

export const INPUT_GROUP_API: ApiRow[] = [
  {
    name: 'value',
    type: 'model<Record<string, unknown>>',
    value: '{}',
    does: 'Two-way bound dictionary with keys matching child segment names.',
  },
  {
    name: 'label',
    type: 'string | null',
    value: 'null',
    does: 'Unified group label pointing to the first interactive segment.',
  },
  {
    name: 'hint',
    type: 'string | null',
    value: 'null',
    does: 'Helper advice text displayed beneath the group container.',
  },
  {
    name: 'error',
    type: 'string | null',
    value: 'null',
    does: 'Validation error text presented with alert icon.',
  },
  {
    name: 'errorMessages',
    type: 'LiquidInputErrorMessages',
    value: '{}',
    does: 'Validator key to error string mapping for reactive forms.',
  },
  {
    name: 'optional',
    type: 'boolean',
    value: 'false',
    does: 'Renders an "Optional" badge beside the group label.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    value: 'false',
    does: 'Disables all nested segments simultaneously.',
  },
];

export const INPUT_GROUP_CSS: ApiRow[] = [
  {
    name: '--liquid-input-group-height',
    type: '<length>',
    value: '44px',
    does: 'Height of the combined group box.',
  },
  {
    name: '--liquid-input-group-radius',
    type: '<length>',
    value: '12px',
    does: 'Outer pill radius surrounding all segments.',
  },
  {
    name: '--liquid-input-group-separator',
    type: '<color>',
    value: 'var(--gray-200)',
    does: 'Color of vertical hairlines separating adjacent segments.',
  },
  {
    name: '--liquid-input-group-separator-height',
    type: '<length>',
    value: '20px',
    does: 'Height of inner divider hairlines.',
  },
];

