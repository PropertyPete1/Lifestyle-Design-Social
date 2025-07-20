module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^nodemailer$': '<rootDir>/__mocks__/nodemailer.ts',
  },
}; 