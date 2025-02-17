import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { Company, BaseEntity, ProgrammeTransfer, User } from '@undp/carbon-library';
import { Programme } from './entities/Programme';
import { ProgrammeCertify } from './entities/ProgrammeCertify';
import { Action } from './enums/action.enum';
import { CompanyRole } from './enums/company.role.enum';
import { ProgrammeStage } from './enums/programme-status.enum';
import { Role } from './enums/role.enum';

type Subjects = InferSubjects<typeof BaseEntity> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export const defineAbility = () => {
  const { build } = new AbilityBuilder(createAppAbility);

  return build({
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
  });
};

export const updateUserAbility = (ability: AppAbility, user: User) => {
  const { can, cannot, rules } = new AbilityBuilder(createAppAbility);
  if (user) {
    if (user.role === Role.Root) {
      can(Action.Manage, 'all');

      cannot(Action.Update, User, ['role', 'apiKey', 'password', 'companyRole', 'email'], {
        id: { $eq: user.id },
      });
      cannot([Action.Update], User, { companyId: { $ne: user.companyId } });
      cannot([Action.Update], Company);
      can([Action.Delete], Company);
      can([Action.Create], Company);
      can(Action.Update, Company, { companyId: { $eq: user.companyId } });
    } else if (
      user.role === Role.Admin &&
      (user.companyRole === CompanyRole.GOVERNMENT || user.companyRole === CompanyRole.MINISTRY)
    ) {
      can(Action.Manage, User, { role: { $ne: Role.Root } });
      cannot(Action.Update, User, ['role', 'apiKey', 'password', 'companyRole', 'email'], {
        id: { $eq: user.id },
      });
      cannot([Action.Update, Action.Delete], User, { companyId: { $ne: user.companyId } });
      can(Action.Update, Company, { companyId: { $eq: user.companyId } });
      cannot(Action.Update, Company, { companyId: { $ne: user.companyId } });
      cannot(Action.Update, Company, ['companyRole']);
      can(Action.Delete, Company);
      can(Action.Create, Company);
      if (user.companyRole === CompanyRole.MINISTRY) {
        can(Action.Read, User);
        cannot([Action.Update, Action.Delete, Action.Read], User, {
          companyId: { $ne: user.companyId },
        });
        cannot(Action.Delete, Company, { companyRole: { $eq: user.companyRole } });
        cannot(Action.Delete, Company, { companyId: { $eq: user.companyId } });
      }
    } else if (user.role === Role.Admin && user.companyRole !== CompanyRole.GOVERNMENT) {
      if (user.companyRole === CompanyRole.MINISTRY) {
        can(Action.Create, Company);
      }
      can(Action.Manage, User, { role: { $ne: Role.Root } });
      cannot([Action.Update, Action.Delete, Action.Read], User, {
        companyId: { $ne: user.companyId },
      });
      cannot(Action.Update, User, ['role', 'apiKey', 'password', 'companyRole', 'email'], {
        id: { $eq: user.id },
      });

      can(Action.Read, Company);
      can(Action.Update, Company, { companyId: { $eq: user.companyId } });
      cannot(Action.Update, Company, { companyId: { $ne: user.companyId } });
      cannot(Action.Update, Company, ['companyRole']);
      cannot(Action.Create, Company);
    } else {
      if (
        user.companyRole === CompanyRole.GOVERNMENT ||
        user.companyRole === CompanyRole.MINISTRY
      ) {
        can(Action.Read, User);
      } else {
        can(Action.Read, User, { companyId: { $eq: user.companyId } });
      }
      can(Action.Update, User, { id: { $eq: user.id } });
      cannot(Action.Update, User, ['email', 'role', 'apiKey', 'password', 'companyRole']);
      can(Action.Read, Company);
    }

    if (user.role === Role.Manager && user.companyRole === CompanyRole.GOVERNMENT) {
      can([Action.Delete], Company);
    }

    if (user.role !== Role.ViewOnly && user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      can(Action.Manage, ProgrammeTransfer);
    }

    if (user.role !== Role.ViewOnly && user.companyRole === CompanyRole.GOVERNMENT) {
      can(Action.Manage, ProgrammeTransfer);
      can(Action.Manage, Programme);
    }

    if (user.role !== Role.ViewOnly && user.companyRole === CompanyRole.CERTIFIER) {
      can(Action.Manage, ProgrammeCertify);
    }

    if (user.role === Role.Admin && user.companyRole === CompanyRole.MRV) {
      can([Action.Create, Action.Read], Programme);
    } else if (user.companyRole === CompanyRole.CERTIFIER) {
      can(Action.Read, Programme, { currentStage: { $in: [ProgrammeStage.AUTHORISED] } });
      can(Action.Read, Programme, { certifierId: { $elemMatch: { $eq: user.companyId } } });
    } else if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      can(Action.Read, Programme, { currentStage: { $eq: ProgrammeStage.AUTHORISED } });
      can(Action.Read, Programme, { companyId: { $elemMatch: { $eq: user.companyId } } });
    }

    // cannot(Action.Delete, User, { id: { $eq: user.id } })
    cannot(Action.Update, User, ['companyRole']);

    cannot([Action.Delete], Company, { companyRole: { $eq: CompanyRole.GOVERNMENT } });

    if (user.role === Role.Admin || user.role === Role.Root) {
      can(Action.Create, User);
    } else {
      cannot(Action.Create, User);
      cannot(Action.Update, User, { id: { $ne: user.id } });
      cannot(Action.Delete, User, { id: { $ne: user.id } });
      cannot(Action.Create, Company);
    }

    if (user.companyState === 0) {
      cannot(Action.Create, 'all');
      cannot(Action.Delete, 'all');
      cannot(Action.Update, 'all');
    }
  }

  ability.update(rules);
};
