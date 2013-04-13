// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {IDENTIFIER_EXPRESSION} from '../syntax/trees/ParseTreeType.js';
import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {
  RUNTIME,
  TRACEUR,
  TYPEOF,
  UNDEFINED
} from '../syntax/PredefinedName.js';
import {TYPEOF, EQUAL_EQUAL_EQUAL} from '../syntax/TokenType.js';
import {
  createArgumentList,
  createBinaryOperator,
  createCallExpression,
  createConditionalExpression,
  createMemberExpression,
  createOperatorToken,
  createParenExpression,
  createStringLiteral,
  createUnaryExpression
} from './ParseTreeFactory.js';

export class TypeofTransformer extends ParseTreeTransformer {

  /**
   * @param {ParseTree} tree
   * @return {ParseTree}
   */
  static transformTree(tree) {
    return new TypeofTransformer().transformAny(tree);
  }

  transformUnaryExpression(tree) {
    if (tree.operator.type !== TYPEOF)
      return super.transformUnaryExpression(tree);

    var operand = this.transformAny(tree.operand);

    // traceur.runtime.typeof(operand))
    var callExpression = createCallExpression(
        createMemberExpression(TRACEUR, RUNTIME, TYPEOF),
        createArgumentList(operand));

    if (operand.type === IDENTIFIER_EXPRESSION) {
      // For ident we cannot just call the function since the ident might not
      // be bound to an identifier. This is important if the free variable
      // pass is not turned on.
      //
      // typeof ident
      //
      // Desugars to
      //
      // (typeof ident === 'undefined' ?
      //     'undefined' : traceur.runtime.typeof(ident))
      return createParenExpression(
          createConditionalExpression(
              // typeof ident === 'undefined'
              createBinaryOperator(
                  // typeof operand
                  createUnaryExpression(TYPEOF, operand),
                  createOperatorToken(EQUAL_EQUAL_EQUAL),
                  createStringLiteral(UNDEFINED)),
              createStringLiteral(UNDEFINED),
              callExpression));
    }

    // typeof expression
    //
    // Desugars to
    //
    // traceur.runtime.typef(expression)
    return callExpression;
  }
}
