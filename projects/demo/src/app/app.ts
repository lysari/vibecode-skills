import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from '@app/shared/components/layout/layout';
import { LiquidToaster } from '@app/shared/components/liquid-toast/liquid-toast';

@Component({
  imports: [Layout, RouterOutlet, LiquidToaster],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
