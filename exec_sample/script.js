if (!/^[a-zA-Z0-9_\-\.]+$/.test(userInput)) {
    throw new Error("Invalid input");
}