import test from 'node:test';
import assert from 'node:assert/strict';
import { localizeApiError } from '../src/lib/apiErrorTranslations.js';

test('player-facing server errors use the selected language and support old BP errors without a code', () => {
  for (const code of ['PROMO_NOT_FOUND','PROMO_ALREADY_USED','PROMO_LIMIT_REACHED','TALENT_RESET_EMPTY','TALENT_RESET_FUNDS','BP_REWARD_UNAVAILABLE','PUDDLE_CLEANUP_REQUIRED']) {
    const english = localizeApiError(code, 'server message', 'en');
    assert.notEqual(english, 'server message');
    assert.doesNotMatch(english, /[А-Яа-яІіЇїЄє]/);
    assert.match(localizeApiError(code, 'server message', 'ru'), /[А-Яа-я]/);
    assert.equal(localizeApiError(code, 'server message', 'uk'), localizeApiError(code, 'server message', 'ua'));
  }
  assert.equal(localizeApiError('PLAYER_ACTION_FAILED', 'Нагорода ще недоступна', 'en'), 'This reward is not available yet');
  assert.equal(localizeApiError('UNKNOWN', 'Specific server error', 'en'), 'Specific server error');
});
