class AIProviderInterface {
  async generate(evaluationContext) {
    throw new Error('generate() must be implemented by concrete AI provider');
  }
}

module.exports = AIProviderInterface;
