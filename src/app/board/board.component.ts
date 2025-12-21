import { Component, Input, OnInit } from '@angular/core';
import { Board, Move } from './game-logic/board';
import { IPiece, PieceTypes, PlayerColor } from './game-logic/pieces/piece';
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

        // bug daca iei nebunul cu regina
        //
        // this.board = new Board('1rbq1knr/pppp1ppp/4p3/8/2BPP3/5N2/2P2PPP/b2QK2R w KQkq - 0 1'); 
        //
        // bug cand dai sah cu tura la g8 se blocheaza nu e mat nici nu zice ca e mat nici nu muta
        //
        // this.board = new Board('r1b1k3/1pp5/p4Q2/3p4/3n4/P1P2P2/5P1P/6RK w KQkq - 0 1');
        
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

    playerColor: PlayerColor = PlayerColor.WHITE;

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
            this.highlightedSqares[move.to.x][move.to.y] = true;
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
        const move = legalMoves.find(m => m.to.x == targetX && m.to.y == targetY);

        if (move) { // if true - move anything
            this.moveBackup = {...move};

            if (
                this.draggedPiece.type === PieceTypes.PAWN && 
                targetY == this.getPawnPromotionRank(this.draggedPiece.color)
            ) {
                this.displayPromotionPicker(event.clientX, event.clientY);
            }
            else {
                this.board.makeMove(move, true);
            }
        }

        this.draggedPiece = null;
        this.resetHighlights();

        if (move) {
            this.highlightMove(move);
            setTimeout(() => {
                const blackMove = this.board.findBestMove(4, PlayerColor.BLACK);
                if (blackMove) {
                    this.board.makeMove(blackMove, true);
                    this.resetHighlights();
                    this.highlightMove(blackMove);
                }
            }, 10);
        }
    }

    private moveBackup: Move | null = null;

    displayPromotionPicker(x: number, y: number) {
        this.promotionPickerVisible = true;
        this.promotionPickerPosition = {
            x, y
        }
    }

    onPawnPromoted(pieceType: PieceTypes): void {
        if (!this.moveBackup) {
            return;
        }
        this.moveBackup.promotion = pieceType;
        this.board.makeMove(this.moveBackup, true);

        this.promotionPickerVisible = false;
    }

    resetHighlights() {
        this.highlightedSqares = Array(8).fill(null).map(() => Array(8).fill(false));
    }

    private highlightMove(move: Move): void {
        this.highlightedSqares[move.from.x][move.from.y] = true;
        this.highlightedSqares[move.to.x][move.to.y] = true;
    }

    switchSides() {
        this.indices.reverse();
    }

    restart() {
        this.board = new Board();
        this.resetHighlights();
    }

    private getPawnPromotionRank(color: PlayerColor): number {
        if (color === PlayerColor.WHITE) {
            return 0;
        }
        return 7;
    }
}
