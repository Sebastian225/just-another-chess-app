import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { IPiece, PlayerColor, Coordinate, PieceTypes, isInBounds, isEqual, Piece } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";

export class Board {
    readonly size = 8;
    pieces: IPiece[] = [];
    activeColor: PlayerColor = PlayerColor.WHITE;
    piecesPosition: (IPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    enPassantSquare: Coordinate | null = null;
    castlingRights = {
        whiteKingSide: false,
        whiteQueenSide: false,
        blackKingSide: false,
        blackQueenSide: false
    }

    private fiftyMovesCounter: number = 0;
    private playerColor: PlayerColor = PlayerColor.WHITE;

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

    private findKing(color: PlayerColor): King | null {
        for (let piece of this.pieces) {
            if (piece.type === PieceTypes.KING && piece.color === color) {
                return piece as King;
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
            if (moves.some(m => m.to.x === king.position.x && m.to.y === king.position.y)) {
                return true;
            }
        }

        return false;
    }

    public areCastleSquaresEmpty(color: PlayerColor, side: CastlingSide): boolean {
        let start = side === CastlingSide.KINGSIDE ? 5 : 1;
        let end = side === CastlingSide.KINGSIDE ? 6 : 3;
        let y = color === PlayerColor.WHITE ? 7 : 0;

        for (let x = start; x <= end; x++) {
            if (this.getPieceAt(x, y) !== null) {
                return false;
            }
        }
        
        return true;
    }

    private isCastlingLegal(move: Move): boolean {
        const start = Math.min(move.to.x, move.from.x);
        const end = Math.max(move.to.x, move.from.x);
        const passingSquares: Coordinate[] = [];

        for (let x = start; x <= end; x++) {
            passingSquares.push({
                x: x,
                y: move.to.y
            });
        }

        const enemyPieces = this.pieces.filter(p => p.color !== move.piece.color);
        for (let p of enemyPieces) {
            for (let enemyMove of p.getPseudoLegalMoves(this)) {
                for (let square of passingSquares) {
                    if (enemyMove.to.x == square.x && enemyMove.to.y == square.y) {
                        return false;
                    }
                }
            }
        }

        return true;
    }
    
    getLegalMoves(piece: IPiece): Move[] {
        const pseudoMoves = piece.getPseudoLegalMoves(this);
        let legalMoves: Move[] = [];
        
        for (const move of pseudoMoves) {
            if (move.isCastling) {
                if (this.isCastlingLegal(move)) {
                    legalMoves.push(move);
                }
            }
            else {
                const snapshot = this.makeMove(move);

                if (!this.isKingInCheck(piece.color)) {
                    legalMoves.push(move);
                }
            
                this.undoMove(snapshot);
            }
        }
    
        return legalMoves;
    }

    private getCastleRookSquare(king: King, side: CastlingSide): Coordinate {
        return {
            x: side === CastlingSide.KINGSIDE ? 7 : 0,
            y: king.color === PlayerColor.WHITE ? 7 : 0
        }
    }

    removePiece(piece: IPiece): void {
        const idx = this.pieces.findIndex(p => p === piece);
        if (idx != -1) {
            this.pieces.splice(idx, 1);
        }
    }

    makeMove(move: Move, isPermanent: boolean = false): MoveSnapshot {
        const {piece, from, to, promotion, isEnPassant, isCastling} = move;

        let capturedPiece = this.getPieceAt(to.x, to.y);
        let hasMovedBefore = 'hasMoved' in piece ? piece.hasMoved as boolean : undefined;
        let capturedPawnPosition: Coordinate | undefined = undefined;
        let castlingRights = {...this.castlingRights};

        if (
            this.enPassantSquare && isEnPassant
        ) {
            capturedPiece = this.getPieceAt(to.x, from.y);
            capturedPawnPosition = {
                x: to.x,
                y: from.y
            }
            capturedPiece = capturedPiece;
            this.piecesPosition[from.y][to.x] = null;
        }

        this.piecesPosition[from.y][from.x] = null;

        let promotionPiece = promotion ? this.getPromotedPiece(promotion, to, piece.color) : null;

        this.piecesPosition[to.y][to.x] = promotion ? promotionPiece : piece;

        if (capturedPiece) {
            this.removePiece(capturedPiece);
        }

        if (promotion) {
            this.removePiece(piece);
        }
        else {
            piece.move(to.x, to.y);
        }

        let castlingSide: CastlingSide | undefined = undefined;

        if (isCastling) {
            castlingSide = from.x < to.x ? CastlingSide.KINGSIDE : CastlingSide.QUEENSIDE;
            const rookPosition = this.getCastleRookSquare(piece as King, castlingSide);
            const rook = this.getPieceAt(rookPosition.x, rookPosition.y)!;
            const rookDestination = this.getRookPositionAfterCastle(piece.color, castlingSide);
            rook.move(rookDestination.x, rookDestination.y);

            this.piecesPosition[rookPosition.y][rookPosition.x] = null;
            this.piecesPosition[rookDestination.y][rookDestination.x] = rook;
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

        if (piece.type === PieceTypes.KING) {
            if (piece.color == PlayerColor.WHITE) {
                this.castlingRights.whiteKingSide = false;
                this.castlingRights.whiteQueenSide = false;
            }
            else {
                this.castlingRights.blackKingSide = false;
                this.castlingRights.blackQueenSide = false;
            }
        }

        if (piece.type === PieceTypes.ROOK) {
            if (move.from.y == 0) {
                if (move.from.x == 0) {
                    this.castlingRights.blackQueenSide = false;
                }
                else if (move.from.x == 7) {
                    this.castlingRights.blackKingSide = false;
                }
            }
            else if (move.from.y == 7) {
                if (move.from.x == 0) {
                    this.castlingRights.whiteQueenSide = false;
                }
                else if (move.from.x == 7) {
                    this.castlingRights.whiteKingSide = false;
                }
            } 
        }

        if (isPermanent) {
            this.switchTurn();
            this.updatePositionHistory();

            // check for game end conditions
            if (!capturedPiece || piece.type !== PieceTypes.PAWN) {
                this.fiftyMovesCounter += 1;
            } else {
                this.fiftyMovesCounter = 0;
            }

            this.checkGameStatus(true);
        }

        const snapshot: MoveSnapshot = {
            piece,
            from,
            to,
            capturedPiece,
            capturedPawnPosition,
            enPassantSquare: this.enPassantSquare,
            castlingSide,
            hasMovedBefore,
            castlingRights
        };
        
        return snapshot;
    }

    private updatePositionHistory(): void {
        const key = this.getPositionKey();
        if (this.positionCounts.has(key)) {
            let count = this.positionCounts.get(key)!;
            this.positionCounts.set(key, count + 1);
        }
        else {
            this.positionCounts.set(key, 1);
        }
    }

    private getPromotedPiece(pieceType: PieceTypes, position: Coordinate, color: PlayerColor): IPiece {
        if (pieceType === PieceTypes.QUEEN) {
            return new Queen(position, color);
        } 
        else if (pieceType === PieceTypes.ROOK) {
            return new Rook(position, color);
        }
        else if (pieceType === PieceTypes.BISHOP) {
            return new Bishop(position, color);
        }
        return new Knight(position, color);
    }

    public isPawnOnPromotionSquare(piece: IPiece): boolean {
        if (piece.type !== PieceTypes.PAWN) {
            return false;
        }

        if (piece.color === PlayerColor.WHITE && piece.position.y == 0) {
            return true;
        }
        if (piece.color === PlayerColor.BLACK && piece.position.y == 7) {
            return true;
        }

        return false;
    }

    private hasInsufficientMaterial(): boolean {
        const nonKings = this.pieces.filter(p => p.type !== PieceTypes.KING);

        // King vs King
        if (nonKings.length === 0) {
            return true;
        }

        // King + minor vs King
        if (nonKings.length === 1) {
            const p = nonKings[0];
            return p.type === PieceTypes.BISHOP || p.type === PieceTypes.KNIGHT;
        }

        // King + bishop vs King + bishop (same color)
        if (nonKings.length === 2) {
            const [p1, p2] = nonKings;

            if (
                p1.type === PieceTypes.BISHOP &&
                p2.type === PieceTypes.BISHOP &&
                p1.color !== p2.color
            ) {
                return this.bishopsOnSameColor(p1, p2);
            }
        }

        return false;
    }

    private bishopsOnSameColor(b1: IPiece, b2: IPiece): boolean {
        const color1 = (b1.position.x + b1.position.y) % 2;
        const color2 = (b2.position.x + b2.position.y) % 2;
        return color1 === color2;
    }

    private isThreefoldRepetition(): boolean {
        const key = this.getPositionKey();
        return (this.positionCounts.get(key) ?? 0) >= 3;
    }

    public checkGameStatus(displayMessage: boolean): number | null {
        if (this.fiftyMovesCounter == 100) {
            // draw by 50 moves rule
            // we check for 100 because we consider 50 whole moves (both white and black moved)
            if (displayMessage) {
                console.log("Draw by 50 moves rule!");
            }
            return 0;
        }

        if (this.hasInsufficientMaterial()) {
            if (displayMessage) {
                console.log("Draw by insufficient material!");
            }
            return 0;
        }

        if (this.isThreefoldRepetition()) {
            if (displayMessage) {
                console.log("Draw by threefold repetition!");
            }
            return 0;
        }

        const opponentPieces = this.pieces.filter(p => p.color === this.activeColor);
        let counter = 0;
        for (let piece of opponentPieces) {
            counter += this.getLegalMoves(piece).length;
        }

        if (counter == 0) {
            if (this.isKingInCheck(this.activeColor)) {
                // this.player turn has lost
                const whoMadeLastMove = this.activeColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
                if (displayMessage) {
                    console.log(`${this.getPlayerName(whoMadeLastMove)} has won!`);
                }
                return whoMadeLastMove === PlayerColor.WHITE ? Infinity : -Infinity;
            }
            else {
                // draw
                if (displayMessage) {
                    console.log('Draw!');
                }
                return 0;
            }
        }

        return null;
    }

    private getPlayerName(color: PlayerColor): string {
        if (color === PlayerColor.WHITE){
            return 'White';
        }
        return 'Black'
    }

    private switchTurn(): void {
        this.activeColor = this.activeColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    }

    private getRookPositionAfterCastle(color: PlayerColor, side: CastlingSide): Coordinate {
        return {
            x: side === CastlingSide.KINGSIDE ? 5: 3,
            y: color === PlayerColor.WHITE ? 7 : 0
        }
    }

    restorePiece(piece: IPiece): void {
        this.pieces.push(piece);
    }

    undoMove(snapshot: MoveSnapshot) {
        const { piece, from, to, capturedPiece, enPassantSquare, capturedPawnPosition, hasMovedBefore, castlingSide } = snapshot;

        if (this.isPawnOnPromotionSquare(piece)) {
            const promotedPiece = this.piecesPosition[to.y][to.x]!;
            this.removePiece(promotedPiece);
        }

        this.piecesPosition[to.y][to.x] = null;
        piece.position.x = from.x;
        piece.position.y = from.y;
        this.piecesPosition[from.y][from.x] = piece;

        if (capturedPiece) {
            this.restorePiece(capturedPiece);
            if (capturedPawnPosition) {
                this.piecesPosition[
                    capturedPawnPosition.y
                ][
                    capturedPawnPosition.x
                ] = capturedPiece;
            }
            else {
                this.piecesPosition[to.y][to.x] = capturedPiece;
            }
        }

        this.enPassantSquare = enPassantSquare;

        if (castlingSide) {
            const rookPosition = this.getRookPositionAfterCastle(piece.color, castlingSide);
            const rook = this.getPieceAt(rookPosition.x, rookPosition.y)! as Rook;

            const rookDest = this.getCastleRookSquare(piece as King, castlingSide);

            this.piecesPosition[rookPosition.y][rookPosition.x] = null;
            rook.position = { ...rookDest };
            this.piecesPosition[rookDest.y][rookDest.x] = rook;
        }

        // todo handle has moved in piece method like move

        if ('hasMoved' in piece && hasMovedBefore !== undefined) {
            piece.hasMoved = hasMovedBefore;
        }
    }

    private positionCounts: Map<string, number> = new Map<string, number>();

    private getPositionKey(): string {
        let key = '';

        // Piece placement
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const piece = this.piecesPosition[y][x];
                if (!piece) {
                    key += '.';
                } else {
                    key += piece.color + piece.type;
                }
            }
        }

        // Side to move
        key += `|${this.activeColor}`;

        // Castling rights - TODO handle
        key += `|${this.castlingRights.whiteKingSide ? 'K' : ''}`;
        key += `${this.castlingRights.whiteQueenSide ? 'Q' : ''}`;
        key += `${this.castlingRights.blackKingSide ? 'k' : ''}`;
        key += `${this.castlingRights.blackQueenSide ? 'q' : ''}`;

        // En passant
        if (this.enPassantSquare) {
            key += `|${this.enPassantSquare.x},${this.enPassantSquare.y}`;
        } else {
            key += '|-';
        }

        return key;
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

        // key += `|${this.castlingRights.whiteKingSide ? 'K' : ''}`;
        // key += `${this.castlingRights.whiteQueenSide ? 'Q' : ''}`;
        // key += `${this.castlingRights.blackKingSide ? 'k' : ''}`;
        // key += `${this.castlingRights.blackQueenSide ? 'q' : ''}`;
        if (castling) {
            for (let c of castling) {
                this.handleCastlingRights(c);
            }
        }

        // TODO later:
        // - en passant square
        // - halfmove clock
        // - fullmove number
    }

    private handleCastlingRights(char: string): void {
        if (char == 'K') {
            this.castlingRights.whiteKingSide = true;
        }
        else if (char == 'Q') {
            this.castlingRights.whiteQueenSide = true;
        }
        else if (char == 'k') {
            this.castlingRights.blackKingSide = true;
        }
        else if (char == 'q') {
            this.castlingRights.blackQueenSide = true;
        }
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

export type Move = {
    piece: IPiece;
    from: Coordinate;
    to: Coordinate;
    promotion?: PieceTypes;
    isEnPassant?: boolean;
    isCastling?: boolean;
};

type MoveSnapshot = {
    piece: IPiece;
    from: Coordinate;
    to: Coordinate;
    capturedPiece: IPiece | null;
    enPassantSquare: Coordinate | null;
    capturedPawnPosition?: Coordinate;
    hasMovedBefore?: boolean;
    castlingSide? : CastlingSide | null;
    castlingRights: CastlingRights;
}; //add promotion?

type CastlingRights = {
    whiteKingSide: boolean,
    whiteQueenSide: boolean,
    blackKingSide: boolean,
    blackQueenSide: boolean
}

export enum CastlingSide {
    KINGSIDE = 1,
    QUEENSIDE,
}

