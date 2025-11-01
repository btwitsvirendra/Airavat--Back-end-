// Get input from the user and print it to the console using Node.js readline
import * as readline from 'readline';
import bcrypt from 'bcrypt';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Give me the password? ', async (input: string) => {
    const hashedInput = await bcrypt.hash(input, 10);
    console.log(`Hashed password: ${hashedInput}`);

    // verify the password
    const isMatch = await bcrypt.compare(input, hashedInput);
    console.log(`Password match: ${isMatch}`);
    rl.close();
});