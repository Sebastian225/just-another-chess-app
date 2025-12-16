import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { IPiece, PlayerColor, Coordinate, PieceTypes, isInBounds, isEqual } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";
import { Error } from "./utils/errors";

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
        if (!king) {
            console.error("king missing");
            return false;
        }

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
        let legalMoves: Coordinate[] = [];
        
        for (const move of pseudoMoves) {
            const snapshot = this.makeMove(piece, move);
        
            if (!this.isKingInCheck(piece.color)) {
                legalMoves.push(move);
            }
        
            this.undoMove(snapshot);
        }

        if (piece.type === PieceTypes.KING) {
            const castlingMoves = this.getLegalCastlingMoves(piece as King);
            legalMoves = legalMoves.concat(castlingMoves);
        }
    
        return legalMoves;
    }

    private getLegalCastlingMoves(king: King): Coordinate[] {
        let result: Coordinate[] = [];

        if (king.hasMoved) {
            return result;
        }

        if (this.isKingSideCastlingAllowed(king)){
            result.push({
                x: king.position.x + 2,
                y: king.position.y
            });
        }

        if (this.isQueenSideCastlingAllowed(king)) {
            result.push({
                x: king.position.x - 2,
                y: king.position.y
            });
        }

        return result;
    }

    private getCastleRookSquare(king: King, side: CastlingSide): Coordinate {
        if (king.color === PlayerColor.WHITE && side === CastlingSide.KINGSIDE) {
            return {
                x: 7,
                y: 7
            }
        }

        if (king.color === PlayerColor.WHITE && side === CastlingSide.QUEENSIDE) {
            return {
                x: 0,
                y: 7
            }
        }

        if (king.color === PlayerColor.BLACK && side === CastlingSide.KINGSIDE) {
            return {
                x: 7,
                y: 0
            }
        }
        
        return {
            x: 0,
            y: 0
        }
    }

    private getCastlingSquaresToCheck(king: King, rookPosition: Coordinate): Coordinate[] {
        if (king.position.y !== rookPosition.y) {
            console.error(Error.CastlingDifferentRanks);
        }

        let result: Coordinate[] = [];

        const direction = king.position.x < rookPosition.x ? 1 : -1;
        let x = king.position.x
        for (let i = 0; i < 3; i++) {
            result.push({
                x: x,
                y: king.position.y
            });
            x += direction;
        }

        return result;
    }

    private isKingSideCastlingAllowed(king: King): boolean {
        const rookPosition = this.getCastleRookSquare(king, CastlingSide.KINGSIDE);
        if (rookPosition.y !== king.position.y) {
            console.error(Error.CastlingDifferentRanks);
        }

        const rook = this.getPieceAt(rookPosition.x, rookPosition.y) as Rook;

        if (!rook || rook.hasMoved){
            return false;
        }

        for (let x = king.position.x + 1; x < rookPosition.x; x++) {
            if (this.getPieceAt(x, king.position.y)) {
                return false;
            }
        }

        return this.isCastlingSafe(king, rookPosition);
    }

    private isCastlingSafe(king: King, rookPosition: Coordinate): boolean {
        const squares = this.getCastlingSquaresToCheck(king, rookPosition);
        const enemyPieces = this.pieces.filter(p => p.color !== king.color);

        for (let piece of enemyPieces) {
            const pieceAttacks = piece.getPseudoLegalMoves(this);
            if (pieceAttacks.find(
                attack => isEqual(attack, squares[0]) || isEqual(attack, squares[1]) || isEqual(attack, squares[2])
            )) {
                return false;
            }
        }
        
        return true;
    }

    private isQueenSideCastlingAllowed(king: King): boolean {
        const rookPosition = this.getCastleRookSquare(king, CastlingSide.QUEENSIDE);
        if (rookPosition.y !== king.position.y) {
            console.error(Error.CastlingDifferentRanks);
        }

        const rook = this.getPieceAt(rookPosition.x, rookPosition.y) as Rook;

        if (!rook || rook.hasMoved){
            return false;
        }

        for (let x = king.position.x - 1; x > rookPosition.x; x--) {
            if (this.getPieceAt(x, king.position.y)) {
                return false;
            }
        }

        return this.isCastlingSafe(king, rookPosition);
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

        if (piece.type === PieceTypes.KING && Math.abs(from.x - to.x) == 2) {
            const castlingSide = from.x < to.x ? CastlingSide.KINGSIDE : CastlingSide.QUEENSIDE;
            const rookPosition = this.getCastleRookSquare(piece as King, castlingSide);
            const rook = this.getPieceAt(rookPosition.x, rookPosition.y)!;
            const rookDestination = this.getRookPositionAfterCastle(piece, castlingSide);
            rook.move(rookDestination.x, rookDestination.y);

            this.piecesPosition[rookPosition.y][rookPosition.x] = null;
            this.piecesPosition[rookDestination.y][rookDestination.x] = rook;

            snapshot.castlingSide = castlingSide;
        }

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

    private getRookPositionAfterCastle(king: IPiece, side: CastlingSide): Coordinate {
        const dx = side === CastlingSide.KINGSIDE ? -1 : 1;
        return {
            x: king.position.x + dx,
            y: king.position.y
        }
    }

    restorePiece(piece: IPiece): void {
        this.pieces.push(piece);
    }

    undoMove(snapshot: MoveSnapshot) { //undo castle
        const { piece, from, to, capturedPiece, enPassantSquare, capturedPawnPosition, hasMovedBefore, castlingSide } = snapshot;

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

        if (castlingSide) {
            const rookPosition = this.getRookPositionAfterCastle(piece, castlingSide);
            const rookDest = this.getCastleRookSquare(piece as King, castlingSide);

            this.piecesPosition[rookPosition.y][rookPosition.x] = null;
            piece.position = { ...rookDest };
            this.piecesPosition[rookDest.y][rookDest.x] = piece;

            const rook = this.getPieceAt(rookPosition.x, rookPosition.y)! as Rook;
            rook.hasMoved = false;
        }

        // todo handle has moved in piece method like move

        if ('hasMoved' in piece && hasMovedBefore !== undefined) {
            piece.hasMoved = hasMovedBefore;
        }
    }

    loadFromFEN(fen: string): void {
        this.pieces = [];

        const parts = fen.trim().split(" ");
        if (parts.length < 2) {
            console.error("Invalid FEN string")
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
            console.error("Invalid FEN: must have 8 ranks");
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
                console.error(`Invalid FEN rank: ${rank}`);
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
                console.error(`Unknown FEN piece: ${char}`);
                throw "fatal fen parse error";
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
    castlingSide? : CastlingSide | null;
};

enum CastlingSide {
    QUEENSIDE,
    KINGSIDE
}

