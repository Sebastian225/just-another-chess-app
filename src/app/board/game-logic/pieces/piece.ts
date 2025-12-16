import { Board } from "../board";

export enum PlayerColor {
    WHITE,
    BLACK
}

export enum PieceTypes {
    PAWN,
    KNIGHT,
    BISHOP,
    ROOK,
    QUEEN,
    KING
}

export type Coordinate = {
    x: number;
    y: number;
}

export interface IPiece {
    imageSrc: string;
    position: Coordinate;
    color: PlayerColor;
    type: PieceTypes;
    getPseudoLegalMoves(board: Board): Coordinate[];
    move(x: number, y: number): void;
}

export abstract class Piece implements IPiece {
    imageSrc: string;
    position: Coordinate;
    color: PlayerColor;
    type: PieceTypes;

    constructor(
        position: Coordinate,
        color: PlayerColor,
        type: PieceTypes
    ) {
        this.position = position;
        this.color = color;
        this.type = type;
        this.imageSrc = this.buildImageSrc();;
    }

    abstract getPseudoLegalMoves(board: Board): Coordinate[];

    private buildImageSrc(): string {
        const colorStr = playerColorToString(this.color);
        const typeStr = pieceTypeToString(this.type);
        return `images/${colorStr}-${typeStr}.png`;
    }

    move(x: number, y: number): void {
        this.position = { x, y };
    }
}

// these should be in utils

const pieceTypeToString = (type: PieceTypes): string => {
    switch (type) {
        case PieceTypes.PAWN: return "pawn";
        case PieceTypes.KNIGHT: return "knight";
        case PieceTypes.BISHOP: return "bishop";
        case PieceTypes.ROOK: return "rook";
        case PieceTypes.QUEEN: return "queen";
        case PieceTypes.KING: return "king";
    }
};

const playerColorToString = (color: PlayerColor): string =>
    color === PlayerColor.WHITE ? "white" : "black";

export const isInBounds = (position: Coordinate): boolean =>
    position.x >= 0 && position.x <= 7 && position.y >= 0 && position.y <= 7

export const isEqual = (a: Coordinate, b: Coordinate): boolean =>
    a.x == b.x && a.y == b.y;


