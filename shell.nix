{ pkgs ? import <nixpkgs> { } }:
let
  mynode = pkgs.nodejs-18_x;
in
pkgs.stdenv.mkDerivation {
  name = "my-shell";
  packages = [  ];
  shellHook = "";
  buildInputs = [ mynode ];
}
