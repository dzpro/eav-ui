﻿using System;
using System.Linq;

namespace ToSic.Eav.BLL.Parts
{
    public class DbPublishing: BllCommandBase
    {
        public DbPublishing(EavDataController c) : base(c) { }


        /// <summary>
        /// Publish a Draft Entity
        /// </summary>
        /// <param name="entityId">ID of the Draft-Entity</param>
        public Entity PublishEntity(int entityId)
        {
            return PublishEntity(entityId, true);
        }

        /// <summary>
        /// Publish a Draft-Entity
        /// </summary>
        /// <param name="entityId">ID of the Draft-Entity</param>
        /// <param name="autoSave">Call SaveChanges() automatically?</param>
        /// <returns>The published Entity</returns>
        internal Entity PublishEntity(int entityId, bool autoSave = true)
        {
            var unpublishedEntity = Context.Entities.GetEntity(entityId);
            if (unpublishedEntity.IsPublished)
                throw new InvalidOperationException(string.Format("EntityId {0} is already published", entityId));

            Entity publishedEntity;

            // Publish Draft-Entity
            if (!unpublishedEntity.PublishedEntityId.HasValue)
            {
                unpublishedEntity.IsPublished = true;
                publishedEntity = unpublishedEntity;
            }
            // Replace currently published Entity with draft Entity and delete the draft
            else
            {
                publishedEntity = Context.Entities.GetEntity(unpublishedEntity.PublishedEntityId.Value);
                Context.Values.CloneEntityValues(unpublishedEntity, publishedEntity);

                // delete the Draft Entity
                Context.Entities.DeleteEntity(unpublishedEntity, false);
            }

            if (autoSave)
                Context.SqlDb.SaveChanges();

            return publishedEntity;
        }

        /// <summary>
        /// Get Draft EntityId of a Published EntityId. Returns null if there's none.
        /// </summary>
        /// <param name="entityId">EntityId of the Published Entity</param>
        internal int? GetDraftEntityId(int entityId)
        {
            return Context.SqlDb.Entities.Where(e => e.PublishedEntityId == entityId && !e.ChangeLogIDDeleted.HasValue).Select(e => (int?)e.EntityID).SingleOrDefault();
        }
    }
}