import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  LiquidGlassWrapperComponent,
  LiquidGlassRenderAs,
} from '@app/shared/components/liquid-glass-wrapper/liquid-glass-wrapper.component';
import { LiquidGlassDirective } from '@app/shared/components/liquid-glass-wrapper/liquid-glass.directive';
import {
  buildLiquidGlassMaps,
  clamp,
} from '@app/shared/components/liquid-glass-wrapper/liquid-glass.maps';

@Component({
  imports: [LiquidGlassWrapperComponent],
  template: `
    <app-liquid-glass-wrapper
      [radius]="radius()"
      [bezel]="bezel()"
      [tint]="tint()"
      [tintOpacity]="tintOpacity()"
      [disabled]="disabled()"
      [renderAs]="renderAs()"
    >
      <div class="inner-card">Glass Content</div>
    </app-liquid-glass-wrapper>
  `,
})
class TestWrapperHost {
  readonly radius = signal(24);
  readonly bezel = signal(30);
  readonly tint = signal('#ffffff');
  readonly tintOpacity = signal(0.15);
  readonly disabled = signal(false);
  readonly renderAs = signal<LiquidGlassRenderAs>('auto');
}

@Component({
  imports: [LiquidGlassDirective],
  template: `
    <div
      class="directive-card"
      appLiquidGlass
      [lgRadius]="radius()"
      [lgDisabled]="disabled()"
    >
      Directive Content
    </div>
  `,
})
class TestDirectiveHost {
  readonly radius = signal(18);
  readonly disabled = signal(false);
}

describe('LiquidGlass', () => {
  describe('LiquidGlassWrapperComponent', () => {
    let fixture: ComponentFixture<TestWrapperHost>;
    let host: TestWrapperHost;
    let element: HTMLElement;

    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestWrapperHost],
      }).compileComponents();

      fixture = TestBed.createComponent(TestWrapperHost);
      host = fixture.componentInstance;
      element = fixture.nativeElement;
      await settle();
    });

    it('renders layer elements and projected content', () => {
      const wrapper = element.querySelector('app-liquid-glass-wrapper');
      expect(wrapper).not.toBeNull();
      expect(wrapper?.classList.contains('lg-host')).toBe(true);
      expect(element.querySelector('.lg-defs')).not.toBeNull();
      expect(element.querySelector('.lg-layer')).not.toBeNull();
      expect(element.querySelector('.lg-tint')).not.toBeNull();
      expect(element.querySelector('.inner-card')?.textContent?.trim()).toBe('Glass Content');
    });

    it('applies bypassed class when disabled is true', async () => {
      host.disabled.set(true);
      await settle();

      const wrapper = element.querySelector('app-liquid-glass-wrapper');
      expect(wrapper?.classList.contains('lg-host--bypassed')).toBe(true);
    });

    it('updates radius style correctly', async () => {
      host.radius.set(36);
      await settle();

      const wrapper = element.querySelector('app-liquid-glass-wrapper') as HTMLElement;
      expect(wrapper.style.borderRadius).toBe('36px');
    });
  });

  describe('LiquidGlassDirective', () => {
    let fixture: ComponentFixture<TestDirectiveHost>;
    let host: TestDirectiveHost;
    let element: HTMLElement;

    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestDirectiveHost],
      }).compileComponents();

      fixture = TestBed.createComponent(TestDirectiveHost);
      host = fixture.componentInstance;
      element = fixture.nativeElement;
      await settle();
    });

    it('applies lg-glass class and injects layer children', () => {
      const card = element.querySelector('.directive-card');
      expect(card).not.toBeNull();
      expect(card?.classList.contains('lg-glass')).toBe(true);
      expect(card?.querySelector('.lg-defs')).not.toBeNull();
      expect(card?.querySelector('.lg-layer')).not.toBeNull();
      expect(card?.querySelector('.lg-tint')).not.toBeNull();
    });

    it('handles disabled state on directive', async () => {
      host.disabled.set(true);
      await settle();

      const card = element.querySelector('.directive-card');
      expect(card?.classList.contains('lg-glass--bypassed')).toBe(true);
    });
  });

  describe('LiquidGlass optics utilities', () => {
    it('clamp correctly bounds numbers', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('buildLiquidGlassMaps returns null or valid maps safely in test environment', () => {
      const maps = buildLiquidGlassMaps({
        width: 100,
        height: 100,
        radius: 12,
        bezel: 10,
        profile: 'convex-squircle',
        thickness: 15,
        depth: 5,
        ior: 1.5,
        specIntensity: 0.8,
        specPower: 8,
      });

      // In JSDOM without canvas context, maps safely falls back to null without throwing
      if (maps) {
        expect(maps.displacement).toBeDefined();
        expect(maps.specular).toBeDefined();
        expect(maps.maxShift).toBeGreaterThanOrEqual(0);
      } else {
        expect(maps).toBeNull();
      }
    });
  });
});

