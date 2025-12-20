import { Board, Move } from "../board";

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
    getPseudoLegalMoves(board: Board): Move[];
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
        this.imageSrc = this.buildImageSrc();
    }

    abstract getPseudoLegalMoves(board: Board): Move[];

    private buildImageSrc(): string {
        const colorStr = playerColorToString(this.color);
        const typeStr = pieceTypeToString(this.type);
        return `images/${colorStr}-${typeStr}.png`;
    }

    move(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }
}

// these should be in utils

export const pieceTypeToString = (type: PieceTypes): string => {
    switch (type) {
        case PieceTypes.PAWN: return "pawn";
        case PieceTypes.KNIGHT: return "knight";
        case PieceTypes.BISHOP: return "bishop";
        case PieceTypes.ROOK: return "rook";
        case PieceTypes.QUEEN: return "queen";
        case PieceTypes.KING: return "king";
    }
};

export const pieceTypeToValue = (type: PieceTypes): number => {
    switch (type) {
        case PieceTypes.PAWN: return 1;
        case PieceTypes.KNIGHT: return 3;
        case PieceTypes.BISHOP: return 3;
        case PieceTypes.ROOK: return 5;
        case PieceTypes.QUEEN: return 9;
        case PieceTypes.KING: return 100;
    }
};

export const playerColorToString = (color: PlayerColor): string =>
    color === PlayerColor.WHITE ? "white" : "black";

export const isInBounds = (position: Coordinate): boolean =>
    position.x >= 0 && position.x <= 7 && position.y >= 0 && position.y <= 7

export const isEqual = (a: Coordinate, b: Coordinate): boolean =>
    a.x == b.x && a.y == b.y;


