# Astro Bush — layered scene v3

Generated using the built-in image_gen tool, with the project's fishing artwork as style references. Final generation prompts and source paths are in `prompts.json`. Transparent margins were trimmed for predictable anchors; originals remain in the generated-images library.

Independent raster layers, back to front:

1. `sky.png`: opaque violet space backdrop.
2. `ground.png`: transparent asteroid platform.
3. Light beam: separate CSS effect, tinted by lamp tier.
4. `bush-1.png`, `bush-2.png`, `bush-3.png`: exactly three foliage stages, all transparent, no pot or fruit baked in.
5. `pot.png`: separate transparent soil planter, in front of the stem base.
6. `tank.png`: separate transparent water canister and connecting hose.
7. `bud.png`: separate transparent fruit sprite reused at five attachment positions.
8. `lamp-1.png`, `lamp-2.png`, `lamp-3.png`: independent transparent upgrade tiers.
9. Scene labels and controls: live HTML, not part of artwork.

The rejected broad-leaf variant is not used. The final plant uses thin serrated leaves with violet tips and slender green branches. The purple seed cones provide the alien distinction.

Local-only preview: `/cosmo-grow-preview`. Stage buttons preview foliage without changing saved gameplay; the layer inspector toggles visibility and previews lamp tiers. Return to the game with “До гри”.

Lamp upgrades cost 6 and 10 local harvest units; cycles take 120/100/80 seconds and award +0/+2/+4 harvest. Upgrades apply to the next planting, preserving an active cycle's duration and yield. Real game rewards and server events are not connected.
