import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  selector: 'app-components-docs',
  styleUrl: './components-docs.scss',
  templateUrl: './components-docs.html',
})
export class ComponentsDocs {}
