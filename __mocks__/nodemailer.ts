export default {
  createTransport: () => ({
    sendMail: async () => Promise.resolve(true),
  }),
}; 