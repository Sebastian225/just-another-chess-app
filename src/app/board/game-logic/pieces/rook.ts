import { Coordinate, Piece, PieceTypes, PlayerColor } from "./piece";

export class Rook extends Piece {
    hasMoved: boolean = false;

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.ROOK);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }

}