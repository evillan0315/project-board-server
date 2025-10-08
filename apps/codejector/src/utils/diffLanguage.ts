import {
  LanguageSupport,
  StreamParser,
  StreamLanguage,
} from '@codemirror/language';

const diffParser: StreamParser<unknown> = {
  token(stream) {
    if (stream.match(/^@@.*@@/)) {
      return 'meta'; // hunk header
    }
    if (stream.match(/^\+.*/)) {
      return 'inserted'; // added lines
    }
    if (stream.match(/^\-.*/)) {
      return 'deleted'; // removed lines
    }
    if (stream.match(/^diff\s--git.*/)) {
      return 'keyword'; // git diff header
    }
    stream.next();
    return null;
  },
};

export function diffLanguage() {
  return new LanguageSupport(StreamLanguage.define(diffParser));
}
