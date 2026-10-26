"""Small executable argparse/Typer comparison; no performance claims.
Run `python tests/reference_cli.py check` where Typer is already installed.
"""
import argparse
import importlib.metadata
from pathlib import Path
import subprocess
import sys


def greet(name: str = "Dal"):
    print(f"Hello, {name}!")


def build(release: bool = False):
    print("release" if release else "debug")


def main():
    mode, *args = sys.argv[1:]
    if mode == "check":
        import typer  # Optional reference tool, never a dependency of args.
        cases = [
            ("argparse", ["--name", "Ada"], "Hello, Ada!"),
            ("typer", ["--name", "Ada"], "Hello, Ada!"),
            ("argparse-multi", ["greet", "--name", "Ada"], "Hello, Ada!"),
            ("typer-multi", ["greet", "--name", "Ada"], "Hello, Ada!"),
            ("argparse-multi", ["build", "--release"], "release"),
            ("typer-multi", ["build", "--release"], "release"),
        ]
        for selected, argv, expected in cases:
            result = subprocess.run([sys.executable, str(Path(__file__).resolve()), selected, *argv],
                                    capture_output=True, text=True, timeout=20)
            assert result.returncode == 0, result.stderr
            assert result.stdout.strip() == expected, result.stdout
        for selected in ("argparse", "typer", "argparse-multi", "typer-multi"):
            for argv, success in ((["--help"], True), (["--unknown"], False)):
                result = subprocess.run([sys.executable, str(Path(__file__).resolve()), selected, *argv],
                                        capture_output=True, text=True, timeout=20)
                assert (result.returncode == 0) == success, (selected, result.stdout, result.stderr)
                if success:
                    assert "Usage:" in result.stdout or "usage:" in result.stdout
                else:
                    assert result.stderr
        print(f"14 reference CLI executions passed; Python {sys.version.split()[0]}; Typer {importlib.metadata.version('typer')}")
        return
    if mode.startswith("argparse"):
        parser = argparse.ArgumentParser(prog="reference", allow_abbrev=False)
        if mode == "argparse":
            parser.add_argument("--name", default="Dal", type=str)
            greet(**vars(parser.parse_args(args)))
        else:
            commands = parser.add_subparsers(dest="command", required=True)
            greeting = commands.add_parser("greet")
            greeting.add_argument("--name", default="Dal", type=str)
            building = commands.add_parser("build")
            building.add_argument("--release", action="store_true")
            parsed = parser.parse_args(args)
            if parsed.command == "greet":
                greet(parsed.name)
            else:
                build(parsed.release)
    else:
        import typer
        sys.argv = [sys.argv[0], *args]
        if mode == "typer":
            typer.run(greet)
        else:
            app = typer.Typer()
            app.command()(greet)
            app.command()(build)
            app()


if __name__ == "__main__":
    main()
