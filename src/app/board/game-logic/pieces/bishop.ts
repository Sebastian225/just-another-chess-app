import { Coordinate, Piece, PieceTypes, PlayerColor } from "./piece";

export class Bishop extends Piece {

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.BISHOP);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }

}