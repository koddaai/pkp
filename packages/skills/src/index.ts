/**
 * @pkp/skills - MCP prompts for AI product assistants
 *
 * Skills are specialized system prompts that help AI assistants
 * provide expert guidance for specific product categories or use cases.
 */

export { CONSUMER_SKILL, type ConsumerSkill } from "./consumer.js";
export { SMARTPHONES_SKILL, type SmartphonesSkill } from "./smartphones.js";
export { NOTEBOOKS_SKILL, type NotebooksSkill } from "./notebooks.js";
export { PRODUCT_EXPLAINER_SKILL, type ProductExplainerSkill } from "./product-explainer.js";

/**
 * Skill definition interface
 */
export interface PKPSkill {
  name: string;
  description: string;
  systemPrompt: string;
  examplePrompts?: Array<{
    name: string;
    description: string;
    template: string;
  }>;
}

/**
 * All available skills
 */
import { CONSUMER_SKILL } from "./consumer.js";
import { SMARTPHONES_SKILL } from "./smartphones.js";
import { NOTEBOOKS_SKILL } from "./notebooks.js";
import { PRODUCT_EXPLAINER_SKILL } from "./product-explainer.js";

export const ALL_SKILLS: Record<string, PKPSkill> = {
  consumer: CONSUMER_SKILL,
  smartphones: SMARTPHONES_SKILL,
  notebooks: NOTEBOOKS_SKILL,
  "product-explainer": PRODUCT_EXPLAINER_SKILL,
};

/**
 * Get a skill by name
 */
export function getSkill(name: string): PKPSkill | undefined {
  return ALL_SKILLS[name];
}

/**
 * List all available skills
 */
export function listSkills(): Array<{ name: string; description: string }> {
  return Object.values(ALL_SKILLS).map((skill) => ({
    name: skill.name,
    description: skill.description,
  }));
}
