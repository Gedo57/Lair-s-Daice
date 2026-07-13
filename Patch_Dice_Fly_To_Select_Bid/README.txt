Patch: Dice fly destination -> Select Bid / Your Dice row

Replace these files:
- src/screens/Gameplay.jsx
- src/styles/gameplay/gameplay.controls.css

Fix:
- Removes dependency on the old hard-coded right-side animation target.
- Measures the actual YOUR DICE row inside Select Bid.
- Supports Desktop, Mobile Landscape, and Mobile Portrait.
- Automatically follows the panel if its layout is moved later.
