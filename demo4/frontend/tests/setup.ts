// Mise en place commune à tous les tests du frontend.
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Chaque test repart d'un DOM propre : sans cela, deux rendus successifs se
// retrouvent dans le même document et les requêtes `getBy…` deviennent ambiguës.
afterEach(() => {
  cleanup();
});
