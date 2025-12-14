import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { IPiece, PlayerColor, Coordinate } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";

export class Board {
    readonly size = 8;
    pieces: IPiece[] = [];
    activeColor: PlayerColor = PlayerColor.WHITE;
    piecesPosition: (IPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    constructor(fen?: string) {
        if (fen) {
            this.loadFromFEN(fen);
        }
        else {
            this.loadFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        }
    }

    updateBoard() {
        this.piecesPosition = Array(8).fill(null).map(() => Array(8).fill(null));
        for (const piece of this.pieces) {
            this.piecesPosition[piece.position.y][piece.position.x] = piece;
        }
    }

    setPiece(piece: IPiece): void {
        this.piecesPosition[piece.position.y][piece.position.x] = piece;
    }

    getPieceAt(x: number, y: number): IPiece | null {
        return this.piecesPosition[y][x];
    }

    loadFromFEN(fen: string): void {
        this.pieces = [];

        const parts = fen.trim().split(" ");
        if (parts.length < 2) {
            throw new Error("Invalid FEN string");
        }

        const [
            piecePlacement,
            activeColor,
            castling,
            enPassant,
            halfmoveClock,
            fullmoveNumber
        ] = parts;

        this.activeColor =
            activeColor === "w"
                ? PlayerColor.WHITE
                : PlayerColor.BLACK;

        const ranks = piecePlacement.split("/");
        if (ranks.length !== 8) {
            throw new Error("Invalid FEN: must have 8 ranks");
        }

        for (let y = 0; y < 8; y++) {
            let x = 0;
            const rank = ranks[y];

            for (const char of rank) {
                if (this.isDigit(char)) {
                    x += Number(char);
                } else {
                    const color =
                        char === char.toUpperCase()
                            ? PlayerColor.WHITE
                            : PlayerColor.BLACK;

                    const position: Coordinate = { x, y };

                    const piece = this.createPieceFromFENChar(
                        char.toLowerCase(),
                        position,
                        color
                    );

                    this.pieces.push(piece);
                    x++;
                }
            }

            if (x !== 8) {
                throw new Error(`Invalid FEN rank: ${rank}`);
            }
        }

        console.log(this.pieces.map(p => p.position))
        this.updateBoard();

        // TODO later:
        // - castling rights
        // - en passant square
        // - halfmove clock
        // - fullmove number
    }

    private createPieceFromFENChar(
        char: string,
        position: Coordinate,
        color: PlayerColor
    ): IPiece {
        switch (char) {
            case "p": return new Pawn(position, color);
            case "n": return new Knight(position, color);
            case "b": return new Bishop(position, color);
            case "r": return new Rook(position, color);
            case "q": return new Queen(position, color);
            case "k": return new King(position, color);
            default:
                throw new Error(`Unknown FEN piece: ${char}`);
        }
    }

    private isDigit(char: string): boolean {
        return char >= "1" && char <= "8";
    }
}
