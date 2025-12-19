import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PieceTypes, pieceTypeToString, PlayerColor, playerColorToString } from '../game-logic/pieces/piece';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-promotion-picker',
    imports: [CommonModule],
    templateUrl: './promotion-picker.component.html',
    styleUrl: './promotion-picker.component.scss',
})
export class PromotionPickerComponent {

    @Input()
    color: PlayerColor = PlayerColor.WHITE;

    pieceTypes: PieceTypes[] = [
        PieceTypes.QUEEN,
        PieceTypes.ROOK,
        PieceTypes.BISHOP,
        PieceTypes.KNIGHT
    ];

    constructor () {

    }

    @Output()
    pieceChosen: EventEmitter<PieceTypes> = new EventEmitter<PieceTypes>();

    onClick(type: PieceTypes): void {
        this.pieceChosen.emit(type);
    }

    buildImageSrc(type: PieceTypes): string {
        const colorStr = playerColorToString(this.color);
        const typeStr = pieceTypeToString(type);
        return `images/${colorStr}-${typeStr}.png`;
    }
}

