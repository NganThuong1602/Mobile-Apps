import type * as SQLite from 'expo-sqlite';
import { Student } from '../models/Student';

let database: SQLite.SQLiteDatabase | null = null;

async function getDatabase() {
  if (!database) {
    // Load the browser worker only when the database is opened on the client.
    const SQLite = await import('expo-sqlite');
    database = await SQLite.openDatabaseAsync('students.db');
  }

  return database;
}

export async function initDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      studentCode TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT ''
    );
  `);
}

export async function getStudents(): Promise<Student[]> {
  const db = await getDatabase();

  return await db.getAllAsync<Student>(
    `
    SELECT
      id,
      name,
      studentCode,
      email,
      avatar
    FROM students
    ORDER BY id DESC
    `
  );
}

export async function getStudentById(
  id: number
): Promise<Student | null> {
  const db = await getDatabase();

  const student = await db.getFirstAsync<Student>(
    `
    SELECT
      id,
      name,
      studentCode,
      email,
      avatar
    FROM students
    WHERE id = ?
    `,
    [id]
  );

  return student ?? null;
}

export async function addStudent(student: Student) {
  const db = await getDatabase();

  return await db.runAsync(
    `
    INSERT INTO students (
      name,
      studentCode,
      email,
      avatar
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      student.name,
      student.studentCode,
      student.email,
      student.avatar,
    ]
  );
}

export async function updateStudent(student: Student) {
  if (!student.id) {
    throw new Error('Student ID is required');
  }

  const db = await getDatabase();

  return await db.runAsync(
    `
    UPDATE students
    SET
      name = ?,
      studentCode = ?,
      email = ?,
      avatar = ?
    WHERE id = ?
    `,
    [
      student.name,
      student.studentCode,
      student.email,
      student.avatar,
      student.id,
    ]
  );
}

export async function deleteStudent(id: number) {
  const db = await getDatabase();

  return await db.runAsync(
    'DELETE FROM students WHERE id = ?',
    [id]
  );
}

export async function isStudentCodeExists(
  studentCode: string,
  excludeId?: number
): Promise<boolean> {
  const db = await getDatabase();

  let result;

  if (excludeId) {
    result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) AS count
      FROM students
      WHERE studentCode = ?
      AND id != ?
      `,
      [studentCode, excludeId]
    );
  } else {
    result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) AS count
      FROM students
      WHERE studentCode = ?
      `,
      [studentCode]
    );
  }

  return (result?.count ?? 0) > 0;
}
