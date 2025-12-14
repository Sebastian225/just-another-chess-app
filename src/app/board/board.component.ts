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
        this.board = new Board();
        this.resetHighlights();
    }


    board: Board;
    readonly indices = Array.from({ length: 8 }, (_, i) => i);
    draggedPiece: IPiece | null = null;
    highlightedSqares: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));

    getSquareColor(x: number, y: number): string {
        return (x + y) % 2 === 0 ? 'white' : 'black';
    }

    getPieceAt(x: number, y: number): IPiece | null {
        return this.board.getPieceAt(x, y);
    }

    onDragStart(event: DragEvent, x: number, y: number) {
        this.draggedPiece = this.board.getPieceAt(x, y);

        if (!this.draggedPiece) {
            return;
        }
        
        const availableMoves = this.draggedPiece.getAvailableMoves(this.board);
        for (let move of availableMoves) {
            this.highlightedSqares[move.x][move.y] = true;
        }

        console.log(this.highlightedSqares)

        event.dataTransfer?.setData('text/plain', JSON.stringify({ x, y }));
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, targetX: number, targetY: number) {
        console.log("old", this.draggedPiece?.position.x, this.draggedPiece?.position.y)
        console.log("new", targetX, targetY)
        event.preventDefault();

        if (!this.draggedPiece) return;

        const legalMoves = this.draggedPiece.getAvailableMoves(this.board);
        // const isLegal = true; // full chaos
        const isLegal = legalMoves.some(m => m.x === targetX && m.y === targetY);

        if (isLegal) {
            // Move piece
            const oldX = this.draggedPiece.position.x;
            const oldY = this.draggedPiece.position.y;

            this.board.piecesPosition[oldY][oldX] = null;
            this.draggedPiece.position = { x: targetX, y: targetY };
            this.board.piecesPosition[targetY][targetX] = this.draggedPiece;

            // Mark as moved if applicable
            if ('hasMoved' in this.draggedPiece) {
                (this.draggedPiece as any).hasMoved = true;
            }
        }

        this.draggedPiece = null;
        this.resetHighlights();
    }

    resetHighlights() {
        this.highlightedSqares = Array(8).fill(null).map(() => Array(8).fill(false));
    }
}
