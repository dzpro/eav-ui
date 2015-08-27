﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using ToSic.Eav.Data;

namespace ToSic.Eav.BLL.Parts
{
    public class DbContentType: BllCommandBase
    {
        public DbContentType(EavDataController cntx) : base(cntx) {}


        private AttributeSet GetAttributeSetByStaticName(string staticName)
        {
            return Context.SqlDb.AttributeSets.FirstOrDefault(a =>
                a.AppID == Context.AppId && a.StaticName == staticName
                );
        }

        public void AddOrUpdate(string staticName, string scope, string name, string description, int? usesConfigurationOfOtherSet = null, bool alwaysShareConfig = false)
        {
            var ct = GetAttributeSetByStaticName(staticName);

            if (ct == null)
            {
                ct = new AttributeSet()
                {
                    AppID = Context.AppId,
                    StaticName = Guid.NewGuid().ToString(),// staticName,
                    Scope = scope == "" ? null : scope,
                    UsesConfigurationOfAttributeSet = usesConfigurationOfOtherSet,
                    AlwaysShareConfiguration = alwaysShareConfig
                };
                Context.SqlDb.AddToAttributeSets(ct);
            }

            ct.Name = name;
            ct.Description = description;
            ct.ChangeLogIDCreated = Context.Versioning.GetChangeLogId(Context.UserName);

            Context.SqlDb.SaveChanges();
        }


        public void Delete(string staticName)
        {
            var setToDelete = GetAttributeSetByStaticName(staticName);

            setToDelete.ChangeLogIDDeleted = Context.Versioning.GetChangeLogId(Context.UserName);
            Context.SqlDb.SaveChanges();
        }


        /// <summary>
        /// Returns the configuration for a content type
        /// </summary>
        public IEnumerable<dynamic> GetContentTypeConfiguration(string contentTypeStaticName)
        {
            var cache = DataSource.GetCache(null, Context.AppId);
            var result = cache.GetContentType(contentTypeStaticName);

            if (result == null)
                throw new Exception("Content type " + contentTypeStaticName + " not found.");

            // Resolve ZoneId & AppId of the MetaData. If this AttributeSet uses configuration of another AttributeSet, use MetaData-ZoneId & -AppId
            var metaDataAppId = result.UsesConfigurationOfAttributeSet.HasValue ? Constants.MetaDataAppId : Context.AppId;
            var metaDataZoneId = result.UsesConfigurationOfAttributeSet.HasValue ? Constants.DefaultZoneId : Context.ZoneId;

            var metaDataSource = DataSource.GetMetaDataSource(metaDataZoneId, metaDataAppId);

            var config = (result as ContentType).AttributeDefinitions.Select(a => new
            {
                a.Value.Type,
                StaticName = a.Value.Name,
                a.Value.IsTitle,
                a.Value.AttributeId,
                MetaData = metaDataSource.GetAssignedEntities(Constants.AssignmentObjectTypeIdFieldProperties, a.Value.AttributeId)
                    .SelectMany(e => e.Attributes)
                    .ToDictionary(ax => ax.Key, ax => ax.Value)
                // GetAttributeMetaData(a.Value.AttributeId, metaDataZoneId, metaDataAppId).ToDictionary(v => v.Key, e => e.Value[0])
            });

            return config;
        }
    }
}
