# PDF Generator

A TypeScript program that generates a PDF file with a specified number of pages. Each page displays its page number in the center.

## Prerequisites

- [Bun](https://bun.sh) runtime

## Installation

1. Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc if you're using zsh

For fish shell users, execute the following commands:
```fish
curl -fsSL https://bun.sh/install | bash
source ~/.config/fish/config.fish
```
If Bun is not in your PATH, add it by appending:
    set -gx PATH $HOME/.bun/bin $PATH
to your ~/.config/fish/config.fish file.
```

2. Clone and setup the project:
```bash
git clone [repository-url]
cd generate-pdf
bun install
```

## Usage

You can run the script in one of two ways:

### Method 1: Direct execution

```bash
bun run src/generatePdf.ts <output-filename> <number-of-pages> [file-size-MB]
```

Example without file size:
```bash
bun run src/generatePdf.ts output.pdf 5  # Generates a 5-page PDF
```
Example with file size:
```bash
bun run src/generatePdf.ts output.pdf 5 10  # Generates a 5-page PDF padded to approx. 10 MB
```

### Method 2: Using npm script

```bash
bun start <output-filename> <number-of-pages> [file-size-MB]
```

Example without file size:
```bash
bun start document.pdf 10  # Generates a 10-page PDF
```
Example with file size:
```bash
bun start document.pdf 10 12  # Generates a 10-page PDF padded to approx. 12 MB
```

## Output

- Generates an A4-sized PDF file with the specified number of pages
- Each page displays its page number in the center with 20pt font size
- Upon completion, displays the filename and number of pages generated

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 