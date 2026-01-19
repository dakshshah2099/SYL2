"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
        console.log(`Connecting to MySQL at ${DB_HOST} as ${DB_USER}...`);
        try {
            const connection = yield promise_1.default.createConnection({
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASS,
            });
            console.log('Connected.');
            yield connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
            console.log(`Database '${DB_NAME}' created or already exists.`);
            yield connection.end();
            process.exit(0);
        }
        catch (error) {
            console.error('Error creating database:', error);
            process.exit(1);
        }
    });
}
setupDatabase();
