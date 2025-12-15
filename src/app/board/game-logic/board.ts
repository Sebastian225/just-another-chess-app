import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { IPiece, PlayerColor, Coordinate, PieceTypes, isInBounds } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";
import { Constants } from "./utils/constants";

export class Board {
    readonly size = 8;
    pieces: IPiece[] = [];
    activeColor: PlayerColor = PlayerColor.WHITE;
    piecesPosition: (IPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    enPassantSquare: Coordinate | null = null;

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

    private findKing(color: PlayerColor): IPiece | null {
        for (let piece of this.pieces) {
            if (piece.type === PieceTypes.KING && piece.color === color) {
                return piece;
            }
        }

        return null;
    }

    private getPiecesOfColor(color: PlayerColor): IPiece[] {
        return this.pieces.filter(p => p.color === color);
    }

    isKingInCheck(color: PlayerColor): boolean {
        const king = this.findKing(color);
        if (!king) throw new Error('King missing');

        const enemyColor = color === PlayerColor.WHITE
            ? PlayerColor.BLACK
            : PlayerColor.WHITE;

        for (const piece of this.getPiecesOfColor(enemyColor)) {
            const moves = piece.getPseudoLegalMoves(this);
            if (moves.some(m => m.x === king.position.x && m.y === king.position.y)) {
                return true;
            }
        }

        return false;
    }

    getLegalMoves(piece: IPiece): Coordinate[] {
        const pseudoMoves = piece.getPseudoLegalMoves(this);
        const legalMoves: Coordinate[] = [];
        
        for (const move of pseudoMoves) {
            const snapshot = this.makeMove(piece, move);
        
            if (!this.isKingInCheck(piece.color)) {
                legalMoves.push(move);
            }
        
            this.undoMove(snapshot);
        }
    
        return legalMoves;
    }

    removePiece(piece: IPiece): void {
        const idx = this.pieces.findIndex(p => p === piece);
        if (idx != -1) {
            this.pieces.splice(idx, 1);
        }
    }

    makeMove(piece: IPiece, to: Coordinate): MoveSnapshot {
        const from = { ...piece.position };

        let capturedPiece = this.getPieceAt(to.x, to.y);

        const snapshot: MoveSnapshot = {
            piece,
            from,
            to,
            capturedPiece,
            enPassantSquare: this.enPassantSquare,
            hasMovedBefore: 'hasMoved' in piece ? piece.hasMoved as boolean : undefined,
        };

        if (
            this.enPassantSquare && 
            piece.type === PieceTypes.PAWN && 
            to.x == this.enPassantSquare.x && 
            to.y == this.enPassantSquare.y
        ) {
            capturedPiece = this.getPieceAt(to.x, from.y);
            snapshot.capturedPawnPosition = {
                x: to.x,
                y: from.y
            }
            snapshot.capturedPiece = capturedPiece;
            this.piecesPosition[from.y][to.x] = null;
        }

        this.piecesPosition[from.y][from.x] = null;
        this.piecesPosition[to.y][to.x] = piece;

        if (capturedPiece) {
            this.removePiece(capturedPiece);
        }

        piece.move(to.x, to.y);

        if (piece.type === PieceTypes.PAWN && Math.abs(from.y - to.y) == 2) {
            this.enPassantSquare = {
                x: from.x,
                y: (from.y + to.y) / 2
            }
        }
        else {
            this.enPassantSquare = null;
        }

        return snapshot;
    }

    restorePiece(piece: IPiece): void {
        this.pieces.push(piece);
    }

    undoMove(snapshot: MoveSnapshot) {
        const { piece, from, to, capturedPiece, enPassantSquare, capturedPawnPosition, hasMovedBefore } = snapshot;

        this.piecesPosition[to.y][to.x] = null;
        piece.position = { ...from };
        this.piecesPosition[from.y][from.x] = piece;

        if (capturedPiece) {
            this.restorePiece(capturedPiece);
            if (capturedPawnPosition) {
                this.piecesPosition[
                    capturedPawnPosition.y
                ][
                    capturedPawnPosition.x
                ] = capturedPiece;
                console.log(capturedPiece)
            }
            else {
                this.piecesPosition[to.y][to.x] = capturedPiece;
            }
        }

        this.enPassantSquare = enPassantSquare;

        if ('hasMoved' in piece && hasMovedBefore !== undefined) {
            piece.hasMoved = hasMovedBefore;
        }
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

type MoveSnapshot = {
    piece: IPiece;
    from: Coordinate;
    to: Coordinate;
    capturedPiece: IPiece | null;
    enPassantSquare: Coordinate | null;
    capturedPawnPosition?: Coordinate;
    hasMovedBefore?: boolean;
};

