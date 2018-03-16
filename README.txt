Anthony Yang, Monica Metcalf
CS452 Proj1

The game is for the player shape (blue square) to avoid collisions with other non-moving shapes by changing the blue square's direction. As time passes, these non-moving shapes will be rearranged on the canvas, and the player shape will speed up, making avoiding collisions more difficult. 

1) Polygon creation
There are 7 different shapes: triangle, square, rectangle, pentagon, hexagon, heptagon, and octagon.
There are two shader programs, one for the player shape and one for the non-moving shapes. The shader for the non-moving shapes picks shapes randomly and draws them.

2) Polygon color
The player shape is always blue. The rest of the shapes can be either yellow, white, or purple.

3) Scoring system
Is based on the time passed while avoiding collisions.

4) Win/lose condition

If collision occurs between player and a non-moving shape, the game is over, and canvas activity stops. If player last a specific amount of time (in this case 10 seconds), they win, and canvas activity also stops.

Note: The easiest way to avoid collisions is to remain in a corner.

5) Player controls and interaction

Manipulate the player shape by keys, which change its direction.

w - up
s - down
a - left
d - right

6) Bugs
There is a function that is supposed to make sure that non-moving shapes are not drawn overlapping the player shape. Nevertheless, there is still a chance this could happen resulting a collision, at no fault to the player.