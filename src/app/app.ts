import { Component } from '@angular/core';
import { BoardComponent } from "./board/board.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [BoardComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'just-another-chess-app';
}
