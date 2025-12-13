import { Component, Input, OnInit } from '@angular/core';
import { Board } from './game-logic/board';
import { IPiece } from './game-logic/pieces/piece';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    imports: [CommonModule],
    standalone: true,
})
export class BoardComponent{
    constructor () {
        this.board = new Board("rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2");
    }

    board: Board;

    readonly indices = Array.from({ length: 8 }, (_, i) => i);

    getSquareColor(x: number, y: number): string {
        return (x + y) % 2 === 0 ? 'white' : 'black';
    }

    getPieceAt(x: number, y: number): IPiece | null {
        return this.board.getPieceAt(x, y);
    }
}
