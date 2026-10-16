import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import {
  LiquidGlassWrapperComponent,
  type LiquidGlassRenderAs,
} from '@app/shared/components/liquid-glass-wrapper/liquid-glass-wrapper.component';
import { LiquidGlassDirective } from '@app/shared/components/liquid-glass-wrapper/liquid-glass.directive';
import { LiquidGlassProfile } from '@app/shared/components/liquid-glass-wrapper/liquid-glass.maps';

interface Section {
  id: string;
  title: string;
}

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidButton, LiquidGlassDirective, LiquidGlassWrapperComponent],
  selector: 'app-liquid-glass-wrapper-docs',
  styleUrls: ['../shared/docs-shared.scss', './liquid-glass-wrapper-docs.scss'],
  templateUrl: './liquid-glass-wrapper-docs.html',
})
export class LiquidGlassWrapperDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly radius = signal(28);
  protected readonly bezel = signal(36);
  protected readonly profile = signal<LiquidGlassProfile>('convex-squircle');
  protected readonly thickness = signal(24);
  protected readonly tint = signal('#ffffff');
  protected readonly tintOpacity = signal(0.12);
  protected readonly interactive = signal(true);
  protected readonly elevation = signal(true);
  protected readonly disabled = signal(false);
  protected readonly renderAs = signal<LiquidGlassRenderAs>('auto');

  protected readonly directiveRadius = signal(24);

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes & Profiles' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly apiRows: ApiRow[] = [
    {
      name: 'radius',
      type: 'number',
      default: '24',
      description: 'Outer corner radius in pixels. Supports pill rounding with large radii.',
    },
    {
      name: 'bezel',
      type: 'number',
      default: '60',
      description: 'Width in pixels of the refracting dome perimeter.',
    },
    {
      name: 'profile',
      type: "'convex-squircle' | 'convex-circle' | 'concave' | 'lip'",
      default: "'convex-squircle'",
      description: 'Mathematical thickness profile of the bezel curvature.',
    },
    {
      name: 'thickness',
      type: 'number',
      default: '28',
      description: 'Peak physical height of the glass dome in pixels.',
    },
    {
      name: 'depth',
      type: 'number',
      default: '10',
      description: 'Distance between underside plane and backdrop.',
    },
    {
      name: 'ior',
      type: 'number',
      default: '1.5',
      description: 'Index of refraction (1.5 window glass, up to 1.8 heavy crystal).',
    },
    {
      name: 'tint',
      type: 'string',
      default: "'#ffffff'",
      description: 'Color wash tint applied over refracted backdrop.',
    },
    {
      name: 'tintOpacity',
      type: 'number',
      default: '0.8',
      description: 'Opacity factor of the color wash tint layer (0..1).',
    },
    {
      name: 'renderAs',
      type: "'auto' | 'blur' | 'off'",
      default: "'auto'",
      description: 'Force optical render mode: auto (full refraction), blur (fallback), or off.',
    },
    {
      name: 'interactive',
      type: 'boolean',
      default: 'true',
      description: 'Tracks pointer movement with a fluid specular highlight wash.',
    },
  ];

  protected readonly playMarkup = computed(() => {
    const parts = [
      `<app-liquid-glass-wrapper`,
      `  [radius]="${this.radius()}"`,
      `  [bezel]="${this.bezel()}"`,
      `  profile="${this.profile()}"`,
      `  [thickness]="${this.thickness()}"`,
      `  tint="${this.tint()}"`,
      `  [tintOpacity]="${this.tintOpacity()}"`,
      this.renderAs() !== 'auto' ? `  renderAs="${this.renderAs()}"` : '',
      !this.interactive() ? `  [interactive]="false"` : '',
      !this.elevation() ? `  [elevation]="false"` : '',
      this.disabled() ? `  [disabled]="true"` : '',
      `>`,
      `  <div class="glass-inner-demo">`,
      `    <h3>Translucent Surface</h3>`,
      `    <p>Refracts underlying wallpaper</p>`,
      `  </div>`,
      `</app-liquid-glass-wrapper>`,
    ].filter(Boolean);

    return parts.join('\n');
  });

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected setRadius(val: number): void {
    this.radius.set(val);
  }

  protected setBezel(val: number): void {
    this.bezel.set(val);
  }

  protected setProfile(p: LiquidGlassProfile): void {
    this.profile.set(p);
  }

  protected setRenderAs(mode: LiquidGlassRenderAs): void {
    this.renderAs.set(mode);
  }

  protected toggleElevation(): void {
    this.elevation.update((v) => !v);
  }

  protected toggleInteractive(): void {
    this.interactive.update((v) => !v);
  }

  protected toggleDisabled(): void {
    this.disabled.update((v) => !v);
  }

  protected resetSettings(): void {
    this.radius.set(28);
    this.bezel.set(36);
    this.profile.set('convex-squircle');
    this.thickness.set(24);
    this.tintOpacity.set(0.12);
    this.disabled.set(false);
  }
}

