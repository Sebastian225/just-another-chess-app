import { Component, Input, OnInit } from '@angular/core';
import { Board } from './game-logic/board';
import { IPiece, PieceTypes } from './game-logic/pieces/piece';
import { CommonModule } from '@angular/common';
import { PromotionPickerComponent } from './promotion-picker/promotion-picker.component';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    imports: [CommonModule, PromotionPickerComponent],
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
    promotionPickerVisible: boolean = false;
    promotionPickerPosition = {
        x: 0,
        y: 0
    }

    getSquareColor(x: number, y: number): string {
        return (x + y) % 2 === 0 ? 'white' : 'black';
    }

    getPieceAt(x: number, y: number): IPiece | null {
        return this.board.getPieceAt(x, y);
    }

    onDragStart(event: DragEvent, x: number, y: number) {
        this.draggedPiece = this.board.getPieceAt(x, y);

        if (!this.draggedPiece || this.draggedPiece.color !== this.board.activeColor) {
            return;
        }
        
        const availableMoves = this.board.getLegalMoves(this.draggedPiece);
        for (let move of availableMoves) {
            this.highlightedSqares[move.x][move.y] = true;
        }

        //console.log(this.highlightedSqares)

        event.dataTransfer?.setData('text/plain', JSON.stringify({ x, y }));
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, targetX: number, targetY: number) {
        event.preventDefault();

        if (!this.draggedPiece || this.draggedPiece.color !== this.board.activeColor) {
            return;
        } 

        const legalMoves = this.board.getLegalMoves(this.draggedPiece);
        // const isLegal = true; // full chaos
        const isLegal = legalMoves.some(m => m.x === targetX && m.y === targetY);

        if (isLegal) {
            // Move piece
            const destination = {
                x: targetX,
                y: targetY
            }
            
            this.board.makeMove(this.draggedPiece, destination);
            if (this.board.isPawnOnPromotionSquare(this.draggedPiece)) {
                this.displayPromotionPicker(event.clientX, event.clientY);
            }
        }

        this.draggedPiece = null;
        this.resetHighlights();
    }

    displayPromotionPicker(x: number, y: number) {
        this.promotionPickerVisible = true;
        this.promotionPickerPosition = {
            x, y
        }
    }

    onPawnPromoted(pieceType: PieceTypes): void {
        this.board.afterPawnPromoted(pieceType);

        this.promotionPickerVisible = false;
    }

    resetHighlights() {
        this.highlightedSqares = Array(8).fill(null).map(() => Array(8).fill(false));
    }

    switchSides() {
        this.indices.reverse();
    }

    restart() {
        this.board = new Board();
    }
}
