export class Constants {
    static readonly Directions = {
        Diagonal: [
            {x: -1, y: -1}, {x: 1, y: -1},
            {x: 1, y: 1}, {x: -1, y: 1}
        ],
        Ortogonal: [
            {x: 0, y: -1}, {x: 0, y: 1},
            {x: 1, y: 0}, {x: -1, y: 0}
        ],
        Knight: [
            { x: 1, y: 2 }, { x: 2, y: 1 },
            { x: 2, y: -1 }, { x: 1, y: -2 },
            { x: -1, y: -2 }, { x: -2, y: -1 },
            { x: -2, y: 1 }, { x: -1, y: 2 },
        ]
    }
}