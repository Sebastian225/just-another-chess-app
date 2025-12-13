import { Coordinate, Piece, PieceTypes, PlayerColor } from "./piece";

export class Queen extends Piece {

    constructor(position: Coordinate, color: PlayerColor) {
        super(position, color, PieceTypes.QUEEN);
    }

    override getAvailableMoves(): Coordinate[] {
        return [];
    }

}