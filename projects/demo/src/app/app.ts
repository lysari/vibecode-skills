import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from '@app/shared/components/layout/layout';

@Component({
  imports: [Layout, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
